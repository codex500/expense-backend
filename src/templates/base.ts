/**
 * Email templates builder
 */

export const getBaseTemplate = (title: string, content: string, ctaLink?: string, ctaText?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px;">Trackify</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">Premium Expense Tracking</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
              ${content}
              
              ${ctaLink ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 40px 0 10px;">
                    <a href="${ctaLink}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25);">
                      ${ctaText || 'Click Here'}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                © ${new Date().getFullYear()} All copyrights are reserved by PixoraLabz.tech
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
