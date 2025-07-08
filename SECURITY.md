# Security Policy

## Supported Versions

We currently support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### For Non-Critical Issues
- Open a GitHub issue with the "security" label
- Provide a clear description of the vulnerability
- Include steps to reproduce if applicable

### For Critical Security Issues
- **DO NOT** create a public GitHub issue
- Email the maintainers directly (provide your contact email)
- Include "SECURITY VULNERABILITY" in the subject line
- Provide detailed information about the vulnerability

### What to Include in Your Report
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Suggested fix (if you have one)
- Your contact information

## Security Considerations

### Spotify API Keys
- Never commit your Spotify Client ID or Client Secret to version control
- Use environment variables for all sensitive configuration
- The Client ID is public and safe to expose in frontend code
- The Client Secret should never be used in frontend applications

### Data Privacy
- We do not store user data on our servers
- All Spotify authentication is handled client-side
- Playlist modifications are performed directly through Spotify's API
- Local storage is used only for temporary access tokens and playlist backups

### Third-Party Dependencies
- We regularly audit our dependencies for security vulnerabilities
- Dependencies are kept up to date
- We use npm audit to check for known vulnerabilities

## Security Best Practices for Contributors

1. **Never commit secrets**: Use `.env.local` for sensitive data
2. **Validate user inputs**: Sanitize any user-provided data
3. **Keep dependencies updated**: Regularly run `npm audit` and `npm update`
4. **Follow HTTPS**: Always use HTTPS in production
5. **Validate Spotify responses**: Don't trust external API responses blindly

## Responsible Disclosure

We appreciate security researchers who responsibly disclose vulnerabilities. We commit to:

- Acknowledging your report within 48 hours
- Providing regular updates on our progress
- Crediting you in our security advisories (if desired)
- Working with you to understand and resolve the issue

Thank you for helping keep ColorBeats secure!
