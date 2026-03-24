namespace BeauNorthAPI.Services
{
    public class EmailService : IEmailService
    {
        public Task SendEmailAsync(string toEmail, string subject, string body)
        {
            Console.WriteLine("----- EMAIL -----");
            Console.WriteLine($"To: {toEmail}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine(body);
            Console.WriteLine("-----------------");

            return Task.CompletedTask;
        }
    }
}