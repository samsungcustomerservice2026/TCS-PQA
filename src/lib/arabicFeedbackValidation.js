/** Egyptian mobile: 11 digits, starts with 010 / 011 / 012 / 015 */
export const EGYPT_MOBILE_REGEX = /^01(0|1|2|5)\d{8}$/;

export const FEEDBACK_PRODUCT_OPTIONS = ['موبايل', 'تلفزيون', 'أجهزة منزلية'];

export function normalizeArabicFeedbackName(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ');
}

export function isValidArabicFeedbackName(raw) {
  const clean = normalizeArabicFeedbackName(raw);
  const parts = clean.split(' ').filter(Boolean);
  return parts.length >= 2;
}

export function normalizeEgyptMobile(raw) {
  return String(raw || '').replace(/\s+/g, '').replace(/^\+20/, '0');
}

export function isValidEgyptMobile(raw) {
  return EGYPT_MOBILE_REGEX.test(normalizeEgyptMobile(raw));
}

export function validateArabicFeedbackForm(fields) {
  const fullName = normalizeArabicFeedbackName(fields.fullName);
  const phoneNumber = normalizeEgyptMobile(fields.phoneNumber);
  const company = String(fields.company || '').trim();
  const product = String(fields.product || '').trim();
  const position = String(fields.position || '').trim();
  const message = String(fields.message || '').trim();

  if (!isValidArabicFeedbackName(fullName)) {
    return { ok: false, message: 'الاسم يجب أن يكون ثنائي (الاسم الأول واسم العائلة).' };
  }
  if (!isValidEgyptMobile(phoneNumber)) {
    return { ok: false, message: 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.' };
  }
  if (!company) {
    return { ok: false, message: 'من فضلك اكتب اسم الشركة.' };
  }
  if (!product) {
    return { ok: false, message: 'من فضلك اختر المنتج.' };
  }
  if (!position) {
    return { ok: false, message: 'من فضلك اكتب المنصب أو الوظيفة.' };
  }
  if (!message) {
    return { ok: false, message: 'من فضلك اكتب استفسارك أو ملاحظتك أو رأيك.' };
  }

  return {
    ok: true,
    data: { fullName, phoneNumber, company, product, position, message },
  };
}
