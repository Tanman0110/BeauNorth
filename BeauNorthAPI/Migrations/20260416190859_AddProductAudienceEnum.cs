using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeauNorthAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddProductAudienceEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Audience",
                table: "Products",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Audience",
                table: "Products");
        }
    }
}
