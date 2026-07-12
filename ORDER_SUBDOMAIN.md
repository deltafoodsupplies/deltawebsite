# Order Subdomain Deployment

Recommended production URL:

```text
order.deltafoodsupplies.com
```

## Recommended Setup

Use the public marketing site on GitHub Pages and host the order portal as a separate protected app:

- `www.deltafoodsupplies.com` or `deltafoodsupplies.com`: public website.
- `order.deltafoodsupplies.com`: customer and staff order portal.
- Backend: Supabase, Firebase, or a custom API with real authentication, password reset emails, database storage, and role-based access.

## DNS

Create a DNS record for the order subdomain:

```text
Type: CNAME
Name: order
Value: your-order-app-host.example.com
```

If using a separate GitHub Pages repository for the static prototype, point `order` to that repository's GitHub Pages host and put this in that repo's `CNAME` file:

```text
order.deltafoodsupplies.com
```

## Security Requirement

The current static prototype can show professional login and reset screens, but GitHub Pages cannot enforce private customer/admin access by itself. Before using real customer prices or orders, connect the portal to a backend that:

- Authenticates customers and staff server-side.
- Sends real password reset emails.
- Stores passwords as hashes or uses managed auth.
- Restricts restaurant forms to approved customers only.
- Restricts admin tools to staff roles only.
- Stores orders in a shared database instead of browser storage.
