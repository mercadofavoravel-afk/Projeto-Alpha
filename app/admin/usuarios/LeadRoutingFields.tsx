'use client';

import { useId, useState } from 'react';

export function LeadRoutingFields({ regions = [] }: { regions?: string[] }) {
  const id = useId();
  const [scope, setScope] = useState(regions.length ? 'REGIONAL' : 'ALL');
  return (
    <fieldset className="full">
      <legend>Fila de recebimento</legend>
      <label htmlFor={`${id}-scope`}>Abrangência dos leads</label>
      <select
        id={`${id}-scope`}
        name="routingScope"
        value={scope}
        onChange={(event) => setScope(event.target.value)}
      >
        <option value="ALL">Fila geral — todos os bairros</option>
        <option value="REGIONAL">Fila regional — bairros selecionados</option>
      </select>
      <label htmlFor={`${id}-regions`}>Bairros da fila regional</label>
      <input
        id={`${id}-regions`}
        name="serviceRegions"
        defaultValue={regions.join(', ')}
        disabled={scope === 'ALL'}
        required={scope === 'REGIONAL'}
        maxLength={2500}
        placeholder="Barra da Tijuca, Ipanema, Centro"
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`}>
        {scope === 'ALL'
          ? 'Pode receber leads de qualquer bairro, inclusive cadastros sem bairro informado.'
          : 'Separe os bairros por vírgula. Cadastros sem bairro não entram na fila regional.'}{' '}
        O profissional também precisa estar ativo, disponível e com capacidade livre.
      </p>
    </fieldset>
  );
}
