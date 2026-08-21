import 'server-only';

export type BookProcessorInput = {
  fileName: string;
  storageUrl: string;
  mimeType: string;
  extracted?: unknown;
};

export type BookProcessorResult = {
  ok: boolean;
  text: string;
  characterCount: number;
  source: 'existing' | 'remote' | 'none';
  mimeType: string;
  message: string;
};

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripHtml(value: string) {
  return cleanText(
    value
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' ',
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' ',
      )
      .replace(
        /<noscript[\s\S]*?<\/noscript>/gi,
        ' ',
      )
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>'),
  );
}

function textFromUnknown(
  value: unknown,
): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    const text = cleanText(value);

    return text ? [text] : [];
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      textFromUnknown(item),
    );
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(
      ([key, item]) => {
        const normalizedKey = key
          .trim()
          .toLocaleLowerCase('pt-BR');

        const ignoredKeys = new Set([
          'id',
          'createdat',
          'updatedat',
          'checksum',
          'progress',
          'status',
        ]);

        if (ignoredKeys.has(normalizedKey)) {
          return [];
        }

        return textFromUnknown(item);
      },
    );
  }

  return [];
}

function extractExistingText(
  extracted: unknown,
) {
  if (
    extracted === null ||
    extracted === undefined
  ) {
    return '';
  }

  const pieces =
    textFromUnknown(extracted);

  return cleanText(
    pieces.join('\n\n'),
  );
}

function isTextMimeType(
  mimeType: string,
) {
  const normalized =
    mimeType.toLowerCase();

  return (
    normalized.startsWith('text/') ||
    normalized.includes('json') ||
    normalized.includes('xml') ||
    normalized.includes('html') ||
    normalized.includes('markdown')
  );
}

function isPdfMimeType(
  mimeType: string,
  fileName: string,
) {
  return (
    mimeType
      .toLowerCase()
      .includes('pdf') ||
    fileName
      .toLowerCase()
      .endsWith('.pdf')
  );
}

async function fetchRemoteText(
  storageUrl: string,
  mimeType: string,
) {
  const response = await fetch(
    storageUrl,
    {
      cache: 'no-store',

      headers: {
        Accept:
          'text/plain,text/html,application/json,application/xml;q=0.9,*/*;q=0.1',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível acessar o material. HTTP ${response.status}.`,
    );
  }

  const responseType =
    response.headers.get(
      'content-type',
    ) || mimeType;

  const raw =
    await response.text();

  if (
    responseType
      .toLowerCase()
      .includes('html')
  ) {
    return stripHtml(raw);
  }

  if (
    responseType
      .toLowerCase()
      .includes('json')
  ) {
    try {
      const parsed =
        JSON.parse(raw);

      return extractExistingText(
        parsed,
      );
    } catch {
      return cleanText(raw);
    }
  }

  return cleanText(raw);
}

export async function processBookContent(
  input: BookProcessorInput,
): Promise<BookProcessorResult> {
  const existingText =
    extractExistingText(
      input.extracted,
    );

  if (
    existingText.length >= 80
  ) {
    return {
      ok: true,
      text: existingText,
      characterCount:
        existingText.length,
      source: 'existing',
      mimeType: input.mimeType,
      message:
        'Conteúdo extraído existente reaproveitado com sucesso.',
    };
  }

  if (
    isPdfMimeType(
      input.mimeType,
      input.fileName,
    )
  ) {
    return {
      ok: false,
      text: '',
      characterCount: 0,
      source: 'none',
      mimeType: input.mimeType,
      message:
        'O material é um PDF e ainda precisa do extrator de PDF do Alpha antes de poder ser processado.',
    };
  }

  if (
    !isTextMimeType(
      input.mimeType,
    )
  ) {
    return {
      ok: false,
      text: '',
      characterCount: 0,
      source: 'none',
      mimeType: input.mimeType,
      message:
        `Formato ainda não suportado para extração automática: ${input.mimeType}.`,
    };
  }

  try {
    const remoteText =
      await fetchRemoteText(
        input.storageUrl,
        input.mimeType,
      );

    if (
      remoteText.length < 80
    ) {
      return {
        ok: false,
        text: remoteText,
        characterCount:
          remoteText.length,
        source: 'remote',
        mimeType: input.mimeType,
        message:
          'O material foi acessado, mas não possui texto suficiente para alimentar a inteligência do Alpha.',
      };
    }

    return {
      ok: true,
      text: remoteText,
      characterCount:
        remoteText.length,
      source: 'remote',
      mimeType: input.mimeType,
      message:
        'Conteúdo textual extraído com sucesso.',
    };
  } catch (error) {
    return {
      ok: false,
      text: '',
      characterCount: 0,
      source: 'none',
      mimeType: input.mimeType,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível processar o material.',
    };
  }
}
