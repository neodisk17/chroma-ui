// ChromaDB query types

export interface ChromaDBWhereClause {
  $and?: ChromaDBWhereClause[];
  $or?: ChromaDBWhereClause[];
  [field: string]:
    | {
        $eq?: string | number;
        $ne?: string | number;
        $gt?: number;
        $gte?: number;
        $lt?: number;
        $lte?: number;
        $in?: (string | number)[];
        $nin?: (string | number)[];
      }
    | ChromaDBWhereClause[]
    | undefined;
}

export interface ChromaDBWhereDocument {
  $contains?: string;
  $not_contains?: string;
  $and?: ChromaDBWhereDocument[];
  $or?: ChromaDBWhereDocument[];
  [key: string]: string | ChromaDBWhereDocument[] | { [operator: string]: string } | undefined;
}

export interface ChromaDBQueryObject {
  nResults?: number;
  queryText?: string;
  where?: ChromaDBWhereClause;
  whereDocument?: ChromaDBWhereDocument;
}

// Metadata type with common value types
export type Metadata = Record<string, string | number | boolean | null>;
