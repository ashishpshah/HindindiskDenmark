using Microsoft.AspNetCore.SignalR;

namespace HindIndisk.Api.Hubs;

public class ClosureHub : Hub
{
    public async Task Subscribe(long branchId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"branch-{branchId}");

    public async Task Unsubscribe(long branchId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"branch-{branchId}");
}
