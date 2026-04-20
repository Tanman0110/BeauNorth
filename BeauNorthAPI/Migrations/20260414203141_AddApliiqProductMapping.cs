using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeauNorthAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddApliiqProductMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BaseCost",
                table: "Products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

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
                name: "ExternalSku",
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

            migrationBuilder.AddColumn<string>(
                name: "FulfillmentProvider",
                table: "Products",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsFulfillmentEnabled",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaseCost",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalDesignId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalProductId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalSku",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExternalVariantId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FulfillmentProvider",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsFulfillmentEnabled",
                table: "Products");
        }
    }
}
