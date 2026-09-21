# Browser & Device Compatibility

## Web NFC Support

| Platform | Browser | Web NFC | NFC URL |
|----------|---------|---------|---------|
| Android | Chrome 89+ | ✅ | ✅ |
| Android | Other browsers | ❌ | ✅ |
| iPhone | Safari | ❌ | ✅ |
| Desktop | Any | ❌ | N/A |

## Feature Detection

```javascript
const supportsWebNFC = 'NDEFReader' in window;
```

## Desktop Experience

Desktop users can access:
- Dashboard, Profiles, Events
- Card management, Attendance reports
- Audit logs, Account management

Desktop users CANNOT:
- Directly scan NFC cards
