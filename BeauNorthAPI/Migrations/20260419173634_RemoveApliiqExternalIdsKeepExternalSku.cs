using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeauNorthAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveApliiqExternalIdsKeepExternalSku : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalDesignId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalProductId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalVariantId",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalDesignId",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalProductId",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVariantId",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
