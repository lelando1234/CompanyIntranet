import React from 'react';
import type { CreateSignatureData } from '@/lib/api';

export interface SignaturePreviewProps {
  signature: Partial<CreateSignatureData>;
  userAvatarUrl?: string;
  companyLogoUrl?: string;
  disclaimerText?: string | null;
}

// ─── HTML Builder Helpers ─────────────────────────────────────────────────────

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPhotoBlock(avatarUrl: string | undefined, show: boolean, size = 72): string {
  if (!show || !avatarUrl) return '';
  return `<img src="${esc(avatarUrl)}" alt="" width="${size}" height="${size}" style="border-radius:50%;display:block;object-fit:cover;margin-bottom:8px;" />`;
}

function buildLogoBlock(logoUrl: string | undefined, show: boolean): string {
  if (!show || !logoUrl) return '';
  return `<img src="${esc(logoUrl)}" alt="" width="120" height="36" style="display:block;object-fit:contain;margin-bottom:8px;" />`;
}

function buildSocialLinks(sig: Partial<CreateSignatureData>, color: string): string {
  const socials: Array<{ url: string | null | undefined; label: string }> = [
    { url: sig.social_linkedin, label: 'LinkedIn' },
    { url: sig.social_twitter, label: 'Twitter/X' },
    { url: sig.social_facebook, label: 'Facebook' },
    { url: sig.social_instagram, label: 'Instagram' },
    { url: sig.social_github, label: 'GitHub' },
    { url: sig.social_youtube, label: 'YouTube' },
    { url: sig.social_custom_url, label: sig.social_custom_label || 'Website' },
  ].filter(s => !!s.url);

  if (socials.length === 0) return '';

  const links = socials
    .map(s => `<a href="${esc(s.url)}" style="color:${color};text-decoration:none;font-size:11px;margin-right:10px;">${esc(s.label)}</a>`)
    .join('');

  return `<tr><td style="padding-top:8px;">${links}</td></tr>`;
}

function buildTextRows(sig: Partial<CreateSignatureData>, color: string, font: string): string {
  const rows: string[] = [];

  if (sig.full_name) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:15px;font-weight:bold;color:${color};padding-bottom:2px;">${esc(sig.full_name)}</td></tr>`);
  }

  const titleParts = [sig.job_title, sig.department].filter(Boolean);
  if (titleParts.length > 0) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:12px;color:#666666;padding-bottom:2px;">${titleParts.map(esc).join(' &bull; ')}</td></tr>`);
  }

  if (sig.company_name) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:12px;color:#444444;font-weight:600;padding-bottom:4px;">${esc(sig.company_name)}</td></tr>`);
  }

  const contactParts: string[] = [];
  if (sig.phone) contactParts.push(`<a href="tel:${esc(sig.phone)}" style="color:#555555;text-decoration:none;">${esc(sig.phone)}</a>`);
  if (sig.mobile) contactParts.push(`<a href="tel:${esc(sig.mobile)}" style="color:#555555;text-decoration:none;">${esc(sig.mobile)}</a>`);
  if (contactParts.length > 0) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:12px;color:#555555;padding-bottom:2px;">${contactParts.join(' &nbsp;|&nbsp; ')}</td></tr>`);
  }

  if (sig.email) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:12px;padding-bottom:2px;"><a href="mailto:${esc(sig.email)}" style="color:${color};text-decoration:none;">${esc(sig.email)}</a></td></tr>`);
  }

  if (sig.website_url) {
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:12px;padding-bottom:2px;"><a href="${esc(sig.website_url)}" style="color:${color};text-decoration:none;">${esc(sig.website_url)}</a></td></tr>`);
  }

  if (sig.office_address) {
    const addrHtml = esc(sig.office_address).replace(/\n/g, '<br/>');
    rows.push(`<tr><td style="font-family:${font},sans-serif;font-size:11px;color:#777777;padding-top:4px;">${addrHtml}</td></tr>`);
  }

  return rows.join('');
}

// ─── Template Builders ────────────────────────────────────────────────────────

function buildHorizontal(sig: Partial<CreateSignatureData>, avatarUrl?: string, logoUrl?: string): string {
  const color = sig.primary_color || '#0080ff';
  const font = sig.font_family || 'Arial';
  const photo = buildPhotoBlock(avatarUrl, !!sig.show_profile_photo);
  const logo = buildLogoBlock(logoUrl, !!sig.show_company_logo);
  const hasImages = photo || logo;

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font},sans-serif;font-size:13px;color:#333333;">
  <tbody>
    <tr>
      ${hasImages ? `
      <td style="padding-right:16px;vertical-align:top;border-right:3px solid ${color};">
        <table cellpadding="0" cellspacing="0" border="0"><tbody>
          ${photo ? `<tr><td>${photo}</td></tr>` : ''}
          ${logo ? `<tr><td>${logo}</td></tr>` : ''}
        </tbody></table>
      </td>
      <td style="padding-left:16px;vertical-align:top;">` : `<td style="border-left:3px solid ${color};padding-left:12px;vertical-align:top;">`}
        <table cellpadding="0" cellspacing="0" border="0"><tbody>
          ${buildTextRows(sig, color, font)}
          ${buildSocialLinks(sig, color)}
        </tbody></table>
      </td>
    </tr>
  </tbody>
</table>`.trim();
}

function buildVertical(sig: Partial<CreateSignatureData>, avatarUrl?: string, logoUrl?: string): string {
  const color = sig.primary_color || '#0080ff';
  const font = sig.font_family || 'Arial';
  const photo = buildPhotoBlock(avatarUrl, !!sig.show_profile_photo, 80);
  const logo = buildLogoBlock(logoUrl, !!sig.show_company_logo);

  const centeredTextRows = buildTextRows(sig, color, font)
    .replace(/style="/g, 'style="text-align:center;');
  const centeredSocials = buildSocialLinks(sig, color)
    .replace(/<td style="/g, '<td style="text-align:center;');

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font},sans-serif;font-size:13px;color:#333333;text-align:center;">
  <tbody>
    ${photo ? `<tr><td style="text-align:center;padding-bottom:4px;">${photo.replace('display:block', 'display:inline-block')}</td></tr>` : ''}
    ${logo ? `<tr><td style="text-align:center;padding-bottom:8px;">${logo.replace('display:block', 'display:inline-block')}</td></tr>` : ''}
    <tr><td>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tbody>
          ${centeredTextRows}
          ${centeredSocials}
        </tbody>
      </table>
    </td></tr>
    <tr><td style="padding-top:8px;"><hr style="border:none;border-top:2px solid ${color};width:60%;margin:0 auto;" /></td></tr>
  </tbody>
</table>`.trim();
}

function buildCompact(sig: Partial<CreateSignatureData>): string {
  const color = sig.primary_color || '#0080ff';
  const font = sig.font_family || 'Arial';

  const parts: string[] = [];
  if (sig.full_name) parts.push(`<strong style="color:${color};">${esc(sig.full_name)}</strong>`);
  if (sig.job_title) parts.push(esc(sig.job_title));
  if (sig.company_name) parts.push(esc(sig.company_name));
  const line1 = parts.join(' &nbsp;&bull;&nbsp; ');

  const contact: string[] = [];
  if (sig.phone) contact.push(`<a href="tel:${esc(sig.phone)}" style="color:#555;text-decoration:none;">${esc(sig.phone)}</a>`);
  if (sig.mobile) contact.push(`<a href="tel:${esc(sig.mobile)}" style="color:#555;text-decoration:none;">${esc(sig.mobile)}</a>`);
  if (sig.email) contact.push(`<a href="mailto:${esc(sig.email)}" style="color:${color};text-decoration:none;">${esc(sig.email)}</a>`);
  if (sig.website_url) contact.push(`<a href="${esc(sig.website_url)}" style="color:${color};text-decoration:none;">${esc(sig.website_url)}</a>`);
  const line2 = contact.join(' &nbsp;|&nbsp; ');

  const socials: Array<{ url: string | null | undefined; label: string }> = [
    { url: sig.social_linkedin, label: 'LinkedIn' },
    { url: sig.social_twitter, label: 'Twitter/X' },
    { url: sig.social_facebook, label: 'Facebook' },
    { url: sig.social_instagram, label: 'Instagram' },
    { url: sig.social_github, label: 'GitHub' },
    { url: sig.social_youtube, label: 'YouTube' },
    { url: sig.social_custom_url, label: sig.social_custom_label || 'Website' },
  ].filter(s => !!s.url);

  const socialLine = socials
    .map(s => `<a href="${esc(s.url)}" style="color:${color};text-decoration:none;font-size:10px;margin-right:8px;">${esc(s.label)}</a>`)
    .join('');

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font},sans-serif;font-size:12px;color:#333333;">
  <tbody>
    <tr>
      <td style="border-left:3px solid ${color};padding-left:10px;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0"><tbody>
          ${line1 ? `<tr><td style="padding-bottom:3px;">${line1}</td></tr>` : ''}
          ${line2 ? `<tr><td style="padding-bottom:3px;color:#555555;">${line2}</td></tr>` : ''}
          ${sig.office_address ? `<tr><td style="font-size:10px;color:#888888;padding-bottom:3px;">${esc(sig.office_address).replace(/\n/g, ', ')}</td></tr>` : ''}
          ${socialLine ? `<tr><td style="padding-top:4px;">${socialLine}</td></tr>` : ''}
        </tbody></table>
      </td>
    </tr>
  </tbody>
</table>`.trim();
}

function buildModern(sig: Partial<CreateSignatureData>, avatarUrl?: string, logoUrl?: string): string {
  const color = sig.primary_color || '#0080ff';
  const font = sig.font_family || 'Arial';
  const photo = buildPhotoBlock(avatarUrl, !!sig.show_profile_photo, 68);
  const logo = buildLogoBlock(logoUrl, !!sig.show_company_logo);
  const hasImages = photo || logo;

  const socialLinks = (() => {
    const socials: Array<{ url: string | null | undefined; label: string }> = [
      { url: sig.social_linkedin, label: 'in' },
      { url: sig.social_twitter, label: 'X' },
      { url: sig.social_facebook, label: 'f' },
      { url: sig.social_instagram, label: 'ig' },
      { url: sig.social_github, label: 'gh' },
      { url: sig.social_youtube, label: 'yt' },
      { url: sig.social_custom_url, label: sig.social_custom_label?.charAt(0)?.toUpperCase() || '↗' },
    ].filter(s => !!s.url);

    if (socials.length === 0) return '';
    const icons = socials.map(s =>
      `<a href="${esc(s.url)}" style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:${color};color:#ffffff;border-radius:50%;font-size:10px;font-weight:bold;text-decoration:none;margin-right:4px;">${esc(s.label)}</a>`
    ).join('');
    return `<tr><td style="padding-top:8px;">${icons}</td></tr>`;
  })();

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:${font},sans-serif;font-size:13px;color:#333333;">
  <tbody>
    <tr>
      <td style="width:4px;background:${color};border-radius:2px;">&nbsp;</td>
      <td style="width:12px;">&nbsp;</td>
      ${hasImages ? `
      <td style="padding-right:14px;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0"><tbody>
          ${photo ? `<tr><td>${photo}</td></tr>` : ''}
          ${logo ? `<tr><td>${logo}</td></tr>` : ''}
        </tbody></table>
      </td>` : ''}
      <td style="vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0"><tbody>
          ${sig.full_name ? `<tr><td style="font-family:${font},sans-serif;font-size:16px;font-weight:bold;color:${color};padding-bottom:2px;">${esc(sig.full_name)}</td></tr>` : ''}
          ${sig.job_title ? `<tr><td style="font-family:${font},sans-serif;font-size:12px;color:#666666;padding-bottom:1px;">${esc(sig.job_title)}${sig.department ? ` &bull; ${esc(sig.department)}` : ''}</td></tr>` : ''}
          ${sig.company_name ? `<tr><td style="font-family:${font},sans-serif;font-size:12px;color:#444444;font-weight:600;padding-bottom:6px;">${esc(sig.company_name)}</td></tr>` : ''}
          <tr><td style="border-top:1px solid #e0e0e0;padding-top:6px;">
            <table cellpadding="0" cellspacing="0" border="0"><tbody>
              ${[
                sig.phone ? `<a href="tel:${esc(sig.phone)}" style="color:#555;text-decoration:none;">${esc(sig.phone)}</a>` : null,
                sig.mobile ? `<a href="tel:${esc(sig.mobile)}" style="color:#555;text-decoration:none;">${esc(sig.mobile)}</a>` : null,
                sig.email ? `<a href="mailto:${esc(sig.email)}" style="color:${color};text-decoration:none;">${esc(sig.email)}</a>` : null,
                sig.website_url ? `<a href="${esc(sig.website_url)}" style="color:${color};text-decoration:none;">${esc(sig.website_url)}</a>` : null,
              ].filter(Boolean).map(c => `<tr><td style="font-size:12px;padding-bottom:2px;">${c}</td></tr>`).join('')}
              ${sig.office_address ? `<tr><td style="font-size:10px;color:#888888;padding-top:4px;">${esc(sig.office_address).replace(/\n/g, '<br/>')}</td></tr>` : ''}
            </tbody></table>
          </td></tr>
          ${socialLinks}
        </tbody></table>
      </td>
    </tr>
  </tbody>
</table>`.trim();
}

// ─── Disclaimer Block ─────────────────────────────────────────────────────────

function buildDisclaimer(text: string | null | undefined, font: string): string {
  if (!text?.trim()) return '';
  const escaped = esc(text).replace(/\n/g, '<br/>');
  return `
<table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-top:1px solid #e0e0e0;width:100%;">
  <tbody>
    <tr>
      <td style="padding-top:10px;font-family:${font},sans-serif;font-size:9px;color:#999999;line-height:1.4;max-width:600px;">
        ${escaped}
      </td>
    </tr>
  </tbody>
</table>`.trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateSignatureHTML(
  sig: Partial<CreateSignatureData>,
  avatarUrl?: string,
  logoUrl?: string,
  disclaimerText?: string | null
): string {
  const font = sig.font_family || 'Arial';
  const template = sig.template || 'horizontal';
  let body: string;
  switch (template) {
    case 'vertical': body = buildVertical(sig, avatarUrl, logoUrl); break;
    case 'compact':  body = buildCompact(sig); break;
    case 'modern':   body = buildModern(sig, avatarUrl, logoUrl); break;
    default:         body = buildHorizontal(sig, avatarUrl, logoUrl);
  }
  return body + buildDisclaimer(disclaimerText, font);
}

// ─── React Component ──────────────────────────────────────────────────────────

const SignaturePreview: React.FC<SignaturePreviewProps> = ({ signature, userAvatarUrl, companyLogoUrl, disclaimerText }) => {
  const html = generateSignatureHTML(signature, userAvatarUrl, companyLogoUrl, disclaimerText);
  return (
    <div
      className="border rounded-md p-4 bg-white overflow-auto min-h-[80px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default SignaturePreview;
