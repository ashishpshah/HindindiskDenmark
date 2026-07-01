using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TaskManagement.DTOs;
using TaskManagement.Services;

namespace TaskManagement.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        // connectionId → OnlineUserDto
        private static readonly ConcurrentDictionary<string, OnlineUserDto> OnlineUsers = new();

        private readonly IChatService _chatService;

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userName = GetUserName();
            var avatarUrl = Context.User?.FindFirst("avatarUrl")?.Value;

            var userInfo = new OnlineUserDto
            {
                UserId = userId,
                UserName = userName,
                AvatarUrl = avatarUrl,
                ConnectedAt = AppClock.Now
            };

            OnlineUsers[Context.ConnectionId] = userInfo;

            await Clients.Others.SendAsync("UserJoined", userInfo);
            await Clients.Caller.SendAsync("OnlineUsers", OnlineUsers.Values.ToList());

            // Join SignalR groups for all rooms the user is a member of
            var rooms = await _chatService.GetRoomsForUserAsync(userId);
            foreach (var room in rooms)
                await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(room.Id));

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (OnlineUsers.TryRemove(Context.ConnectionId, out var userInfo))
            {
                await Clients.Others.SendAsync("UserLeft", userInfo.UserId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        // Send to global (roomId = null) or a specific room
        public async Task SendMessage(SendMessageDto dto)
        {
            var senderId = GetUserId();

            // For room messages, verify membership
            if (dto.RoomId.HasValue)
            {
                var isMember = await _chatService.IsMemberAsync(dto.RoomId.Value, senderId);
                if (!isMember) return;
            }

            var saved = await _chatService.SaveMessageAsync(senderId, dto);

            if (dto.RoomId.HasValue)
                await Clients.Group(RoomGroup(dto.RoomId.Value)).SendAsync("ReceiveMessage", saved);
            else
                await Clients.All.SendAsync("ReceiveMessage", saved);
        }

        public async Task JoinRoom(int roomId)
        {
            var userId = GetUserId();
            var isMember = await _chatService.IsMemberAsync(roomId, userId);
            if (isMember)
                await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        }

        public async Task StartTyping(int? roomId)
        {
            var userId = GetUserId();
            var userName = GetUserName();
            if (roomId.HasValue)
                await Clients.OthersInGroup(RoomGroup(roomId.Value)).SendAsync("TypingStarted", userId, userName);
            else
                await Clients.Others.SendAsync("TypingStarted", userId, userName);
        }

        public async Task StopTyping(int? roomId)
        {
            var userId = GetUserId();
            if (roomId.HasValue)
                await Clients.OthersInGroup(RoomGroup(roomId.Value)).SendAsync("TypingStopped", userId);
            else
                await Clients.Others.SendAsync("TypingStopped", userId);
        }

        private static string RoomGroup(int roomId) => $"room_{roomId}";

        private int GetUserId()
        {
            var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)
                        ?? Context.User?.FindFirst("sub")
                        ?? Context.User?.FindFirst("nameid");
            return int.TryParse(claim?.Value, out var id) ? id : 0;
        }

        private string GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? Context.User?.FindFirst("unique_name")?.Value
                ?? Context.User?.FindFirst("name")?.Value
                ?? "Unknown";
        }
    }
}
