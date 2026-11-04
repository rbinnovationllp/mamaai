import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createId } from "./in-memory-store";
import { getMamaAiTableName, mamaAiDynamoDb } from "./dynamodb-client";

export type TiffinFavourite = { favouriteId: string; userId: string; recipeId: string; recipeName: string; tiffinType: "school_tiffin" | "office_tiffin" | "general"; createdAt: string };
const key=(userId:string,id:string)=>({PK:`USER#${userId}`,SK:`TIFFIN_FAVOURITE#${id}`});
export class TiffinFavouriteRepository {
  async list(userId:string) { const r=await mamaAiDynamoDb.send(new QueryCommand({TableName:getMamaAiTableName(),KeyConditionExpression:"PK=:pk AND begins_with(SK,:prefix)",ExpressionAttributeValues:{":pk":`USER#${userId}`,":prefix":"TIFFIN_FAVOURITE#"}})); return (r.Items??[]).map(x=>x.record as TiffinFavourite).filter(Boolean); }
  async create(userId:string,input:Omit<TiffinFavourite,"favouriteId"|"userId"|"createdAt">) { const record={...input,userId,favouriteId:createId("tiffin-favourite"),createdAt:new Date().toISOString()}; await mamaAiDynamoDb.send(new PutCommand({TableName:getMamaAiTableName(),Item:{...key(userId,record.favouriteId),entityType:"tiffin_favourite",record},ConditionExpression:"attribute_not_exists(PK)"})); return record; }
  async remove(userId:string,favouriteId:string) { await mamaAiDynamoDb.send(new DeleteCommand({TableName:getMamaAiTableName(),Key:key(userId,favouriteId),ConditionExpression:"attribute_exists(PK)"})); }
}
