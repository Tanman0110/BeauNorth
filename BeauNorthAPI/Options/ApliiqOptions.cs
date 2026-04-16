namespace BeauNorthAPI.Options
{
    public class ApliiqOptions
    {
        public string BaseUrl { get; set; } = "https://api.apliiq.com";
        public string ApiKey { get; set; } = string.Empty;
        public string SharedSecret { get; set; } = string.Empty;
    }
}