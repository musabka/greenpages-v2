# Notifications Broadcast Module

## Overview
Admin interface for broadcasting notifications to user segments in the Green Pages system.

## Features

### Notification Broadcasting
- Send notifications to specific user roles (Admin, Agent, User)
- Send notifications to specific user IDs
- Support for all notification types:
  - System notifications
  - Subscription expiry alerts
  - Review replies
  - Report resolutions
  - Points earned notifications

### Form Features
- **Title**: Up to 100 characters
- **Body**: Up to 500 characters
- **Type Selection**: Dropdown for notification type
- **Role Targeting**: Checkboxes for Admin, Agent, User roles
- **User ID Targeting**: Comma-separated list of specific user IDs
- **Validation**: Real-time form validation
- **Feedback**: Success/error messages with user count

## User Interface

### Layout
- Full RTL (Right-to-Left) support for Arabic
- Responsive design for all screen sizes
- Clean, intuitive form layout
- Visual feedback for all actions

### Components Used
- AdminLayout (main layout wrapper)
- Card components for sections
- Form inputs with labels
- Checkboxes for role selection
- Success/error alert cards
- Loading states

## API Integration

### Endpoint
```
POST /notifications/broadcast
```

### Request
```typescript
{
  type: NotificationType;
  title: string;
  body: string;
  targetRoles?: UserRole[];
  targetUserIds?: string[];
}
```

### Response
```typescript
{
  count: number;
  message: string;
}
```

## Access Control
- Requires `SEND_NOTIFICATIONS` permission
- Only ADMIN role has this permission by default
- Protected by JWT authentication

## Navigation
- Accessible from sidebar: "الإشعارات" (Notifications)
- Route: `/notifications`
- Icon: Bell icon

## Usage Example

1. **Broadcast to all users:**
   - Check "المستخدمون العاديون" (Regular Users)
   - Enter title and body
   - Click "إرسال الإشعار"

2. **Broadcast to specific users:**
   - Enter user IDs: `user-1, user-2, user-3`
   - Enter title and body
   - Click "إرسال الإشعار"

3. **Broadcast to agents:**
   - Check "المندوبون" (Agents)
   - Enter title and body
   - Click "إرسال الإشعار"

## Files
- `page.tsx` - Main notification broadcast page
- `IMPLEMENTATION_NOTES.md` - Detailed implementation notes
- `README.md` - This file

## Requirements Satisfied
✅ Requirement 22.5: Web Admin shall allow sending broadcast notifications to user segments

## Testing
The page has been built successfully and is accessible at `/notifications` route.

### Manual Testing Steps
1. Login as admin user
2. Navigate to "الإشعارات" in sidebar
3. Fill out the notification form
4. Select target users (roles or IDs)
5. Submit and verify success message
6. Check that notifications were received by target users

## Future Enhancements
- Notification scheduling
- Notification templates
- Preview before sending
- Notification history
- Rich text editor
- Analytics dashboard
