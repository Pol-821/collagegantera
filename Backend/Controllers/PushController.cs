using CollaGegantera.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PushController : ControllerBase
    {
        private readonly PushNotificationService _pushService;

        public PushController(PushNotificationService pushService)
        {
            _pushService = pushService;
        }

        [HttpGet("vapid-public-key")]
        [AllowAnonymous]
        public IActionResult GetVapidPublicKey()
        {
            return Ok(new { PublicKey = _pushService.GetPublicKey() });
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await _pushService.SubscribeAsync(userId, dto.Endpoint, dto.P256dh, dto.Auth);
            return Ok(new { Message = "Subscrit a notificacions push." });
        }

        [HttpPost("unsubscribe")]
        public async Task<IActionResult> Unsubscribe([FromBody] PushUnsubscribeDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            await _pushService.UnsubscribeAsync(userId, dto.Endpoint);
            return Ok(new { Message = "Subscripció eliminada." });
        }
    }

    public class PushSubscriptionDto
    {
        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }

    public class PushUnsubscribeDto
    {
        public string Endpoint { get; set; } = string.Empty;
    }
}
