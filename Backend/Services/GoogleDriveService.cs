namespace CollaGegantera.Api.Services
{
    public class GoogleDriveService
    {
        private readonly string _uploadsPath;
        private readonly string _avatarsPath;
        private readonly string _photosPath;
        private readonly ILogger<GoogleDriveService> _logger;

        public GoogleDriveService(IWebHostEnvironment env, ILogger<GoogleDriveService> logger)
        {
            _logger = logger;
            _uploadsPath = Path.Combine(env.WebRootPath, "uploads");
            _avatarsPath = Path.Combine(_uploadsPath, "avatars");
            _photosPath = Path.Combine(_uploadsPath, "photos");

            Directory.CreateDirectory(_avatarsPath);
            Directory.CreateDirectory(_photosPath);
        }

        public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string mimeType, bool isAvatar = false)
        {
            var targetDir = isAvatar ? _avatarsPath : _photosPath;
            var filePath = Path.Combine(targetDir, fileName);

            using var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write);
            await fileStream.CopyToAsync(fs);

            var subfolder = isAvatar ? "avatars" : "photos";
            var url = $"/uploads/{subfolder}/{fileName}";
            _logger.LogInformation("Saved file '{Name}' locally", fileName);
            return url;
        }

        public Task DeleteFileByUrlAsync(string url)
        {
            if (string.IsNullOrEmpty(url)) return Task.CompletedTask;

            try
            {
                if (url.StartsWith("/uploads/"))
                {
                    var relativePath = url["/uploads/".Length..];
                    var fullPath = Path.Combine(_uploadsPath, relativePath);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        _logger.LogInformation("Deleted local file '{Path}'", relativePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete file '{Url}'", url);
            }

            return Task.CompletedTask;
        }
    }
}
