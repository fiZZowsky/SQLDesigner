// DTO zgodne z backendem (JsonStringEnumConverter => nazwy enumów jako stringi)

export type SqlDefaultKind = 'None' | 'RawExpression' | 'Literal';

export interface ProjectListItemDto {
  id: number;
  name: string;
  tablesCount: number;
}

export interface IdResponse { id: number; }

export interface ProjectUpsertDto {
  name: string;
  description?: string | null;
  tables: TableDto[];
}

export interface TableDto {
  schema: string;
  name: string;
  primaryKeyName?: string | null;
  columns: ColumnDto[];
  foreignKeys: ForeignKeyDto[];
  indexes: IndexDto[];
  checkConstraints: CheckConstraintDto[];
  uniqueConstraints: UniqueConstraintDto[];
}

export interface ColumnDto {
  name: string;
  dataType: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  primaryKeyOrder?: number | null;
  isIdentity: boolean;
  identitySeed: number;
  identityIncrement: number;
  defaultSql?: string | null;
  defaultKind: SqlDefaultKind;
  isUnique: boolean;
}

export interface ForeignKeyDto {
  name?: string | null;
  refSchema: string;
  refTable: string;
  onDeleteAction?: string | null; // 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION'
  columns: ForeignKeyColumnDto[];
}
export interface ForeignKeyColumnDto { columnName: string; refColumnName: string; }

export interface IndexDto {
  name?: string | null;
  isUnique: boolean;
  columns: IndexColumnDto[];
  includeColumnsCsv?: string | null;
}
export interface IndexColumnDto { columnName: string; descending: boolean; }

export interface CheckConstraintDto { name?: string | null; expression: string; }
export interface UniqueConstraintDto { name?: string | null; columnsCsv: string; }
