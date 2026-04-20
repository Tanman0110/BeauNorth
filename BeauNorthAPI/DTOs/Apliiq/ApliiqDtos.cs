using System.Text.Json.Serialization;

namespace BeauNorthAPI.DTOs.Apliiq
{
    public class ApliiqCreateOrderRequest
    {
        [JsonPropertyName("number")]
        public string Number { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("order_number")]
        public string OrderNumber { get; set; } = string.Empty;

        [JsonPropertyName("line_items")]
        public List<ApliiqLineItem> LineItems { get; set; } = new();

        [JsonPropertyName("billing_address")]
        public ApliiqAddress BillingAddress { get; set; } = new();

        [JsonPropertyName("shipping_address")]
        public ApliiqAddress ShippingAddress { get; set; } = new();
    }

    public class ApliiqLineItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("price")]
        public string Price { get; set; } = "0.00";

        [JsonPropertyName("grams")]
        public int Grams { get; set; } = 0;

        [JsonPropertyName("sku")]
        public string Sku { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class ApliiqAddress
    {
        [JsonPropertyName("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("last_name")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("address1")]
        public string Address1 { get; set; } = string.Empty;

        [JsonPropertyName("address2")]
        public string? Address2 { get; set; }

        [JsonPropertyName("city")]
        public string City { get; set; } = string.Empty;

        [JsonPropertyName("province")]
        public string Province { get; set; } = string.Empty;

        [JsonPropertyName("province_code")]
        public string ProvinceCode { get; set; } = string.Empty;

        [JsonPropertyName("zip")]
        public string Zip { get; set; } = string.Empty;

        [JsonPropertyName("country")]
        public string Country { get; set; } = string.Empty;

        [JsonPropertyName("country_code")]
        public string CountryCode { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;
    }

    public class ApliiqCreateOrderResult
    {
        public bool Success { get; set; }
        public bool AcceptedButPending { get; set; }
        public int StatusCode { get; set; }
        public string RawResponse { get; set; } = string.Empty;
        public string? ProviderOrderId { get; set; }
        public string? Message { get; set; }
    }

    public class ApliiqFulfillmentWebhookPayload
    {
        [JsonPropertyName("fulfillment")]
        public ApliiqFulfillmentWebhookBody? Fulfillment { get; set; }
    }

    public class ApliiqFulfillmentWebhookBody
    {
        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("tracking_company")]
        public string? TrackingCompany { get; set; }

        [JsonPropertyName("tracking_numbers")]
        public List<string>? TrackingNumbers { get; set; }

        [JsonPropertyName("tracking_urls")]
        public List<string>? TrackingUrls { get; set; }
    }
}