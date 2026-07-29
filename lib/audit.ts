import "server-only";
import { db } from "@/lib/db";
export async function audit(action:string,entityType:string,entityId:string|undefined,userId:string|undefined,metadata?:Record<string,unknown>){return db.auditLog.create({data:{action,entityType,entityId,userId,metadata}})}
