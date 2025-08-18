using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SqlGen.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    Schema = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false, defaultValue: "dbo"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PrimaryKeyName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tables_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CheckConstraints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Expression = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckConstraints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckConstraints_Tables_TableId",
                        column: x => x.TableId,
                        principalTable: "Tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Columns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Length = table.Column<int>(type: "int", nullable: true),
                    Precision = table.Column<int>(type: "int", nullable: true),
                    Scale = table.Column<int>(type: "int", nullable: true),
                    IsNullable = table.Column<bool>(type: "bit", nullable: false),
                    IsPrimaryKey = table.Column<bool>(type: "bit", nullable: false),
                    PrimaryKeyOrder = table.Column<int>(type: "int", nullable: true),
                    IsIdentity = table.Column<bool>(type: "bit", nullable: false),
                    IdentitySeed = table.Column<int>(type: "int", nullable: false),
                    IdentityIncrement = table.Column<int>(type: "int", nullable: false),
                    DefaultSql = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DefaultKind = table.Column<int>(type: "int", nullable: false),
                    IsUnique = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Columns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Columns_Tables_TableId",
                        column: x => x.TableId,
                        principalTable: "Tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ForeignKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    RefSchema = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false, defaultValue: "dbo"),
                    RefTable = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OnDeleteAction = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForeignKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForeignKeys_Tables_TableId",
                        column: x => x.TableId,
                        principalTable: "Tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Indexes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsUnique = table.Column<bool>(type: "bit", nullable: false),
                    IncludeColumnsCsv = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Indexes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Indexes_Tables_TableId",
                        column: x => x.TableId,
                        principalTable: "Tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UniqueConstraints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ColumnsCsv = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UniqueConstraints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UniqueConstraints_Tables_TableId",
                        column: x => x.TableId,
                        principalTable: "Tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ForeignKeyColumns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ForeignKeyId = table.Column<int>(type: "int", nullable: false),
                    ColumnName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RefColumnName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ForeignKeyColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ForeignKeyColumns_ForeignKeys_ForeignKeyId",
                        column: x => x.ForeignKeyId,
                        principalTable: "ForeignKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IndexColumns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IndexId = table.Column<int>(type: "int", nullable: false),
                    ColumnName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descending = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IndexColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IndexColumns_Indexes_IndexId",
                        column: x => x.IndexId,
                        principalTable: "Indexes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CheckConstraints_TableId",
                table: "CheckConstraints",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Columns_TableId",
                table: "Columns",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_ForeignKeyColumns_ForeignKeyId",
                table: "ForeignKeyColumns",
                column: "ForeignKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_ForeignKeys_TableId",
                table: "ForeignKeys",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_IndexColumns_IndexId",
                table: "IndexColumns",
                column: "IndexId");

            migrationBuilder.CreateIndex(
                name: "IX_Indexes_TableId",
                table: "Indexes",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Tables_ProjectId_Schema_Name",
                table: "Tables",
                columns: new[] { "ProjectId", "Schema", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UniqueConstraints_TableId",
                table: "UniqueConstraints",
                column: "TableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CheckConstraints");

            migrationBuilder.DropTable(
                name: "Columns");

            migrationBuilder.DropTable(
                name: "ForeignKeyColumns");

            migrationBuilder.DropTable(
                name: "IndexColumns");

            migrationBuilder.DropTable(
                name: "UniqueConstraints");

            migrationBuilder.DropTable(
                name: "ForeignKeys");

            migrationBuilder.DropTable(
                name: "Indexes");

            migrationBuilder.DropTable(
                name: "Tables");

            migrationBuilder.DropTable(
                name: "Projects");
        }
    }
}
