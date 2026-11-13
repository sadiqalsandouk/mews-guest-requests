"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Category } from "@/lib/requests";
import type { OptionId } from "@/lib/options";

// The guest app's own words, in the guest's language. Staff always see English
// (the server translates what guests type). Names stay as they are.

// The world's five most spoken languages by total speakers (Ethnologue), which
// happens to include Arabic, so the app also shows right-to-left.
export const LANGS = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ar", name: "العربية", flag: "🇦🇪" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];
export const isRtl = (l: Lang) => l === "ar";

type Dict = {
  guestRequests: string; welcome: string; signInSub: string; surname: string; roomNumber: string;
  continue: string; signingIn: string; notFound: string; enterBoth: string; genericError: string;
  room: (room: string) => string; home: string; signOut: string; language: string;
  howCanWeHelp: string; anythingElse: string; placeholderMic: string; placeholder: string;
  reading: string; ticked: string; orTap: string; inEnglish: string;
  groups: Record<string, string>; tiles: Record<OptionId, string>;
  send: string; sendItems: (n: number) => string; sending: string; dialBefore: string; dialAfter: string;
  cat: Record<Category, string>;
  sendingBack: (n: string) => string; notSortedYet: string; receivedTitle: string; receivedSub: string;
  onIt: (n: string) => string; hasIt: (n: string, dept: string) => string; onTheWayTitle: (n: string) => string;
  heading: (room: string) => string; thanksChecking: string; gladSorted: string; markedFixed: string;
  checkAllGood: string; allSorted: string; enjoyStay: string;
  removedTitle: string; removedSub: string; loading: string; dangerTitle: string; dangerSub: string;
  takingLonger: string; aimBy: string; isItFixed: string; yesAllGood: string; notYet: string;
  sentInEnglish: string; loggedByDesk: string;
  stepReceived: string; stepPassed: (n: string) => string; stepOnTheWay: string; stepFixed: string; stepClosed: string;
  ratingWords: string[]; howWas: (n: string) => string; thanksRating: (n: string) => string; sorryDM: string;
  passedOn: (n: string) => string; willPass: (n: string) => string; thanksFeedback: string; done: string;
  notNow: string; wentWell: string; wentWrong: string; anythingToAdd: string; tellMore: string; submit: string;
  tags: Record<string, string>;
  tipAsk: (n: string) => string; noCash: string; payWith: (amount?: number) => string; paying: string;
  tipSent: (amount: number, n: string) => string; thankYou: string; demoNoMoney: string;
};

const en: Dict = {
  guestRequests: "Guest requests", welcome: "Welcome", signInSub: "Enter the surname on your booking and your room number.",
  surname: "Surname", roomNumber: "Room number", continue: "Continue", signingIn: "Signing in…",
  notFound: "We couldn't find that booking. Check your surname and room number.", enterBoth: "Enter your surname and room number.",
  genericError: "Something went wrong. Try again.",
  room: (r) => `Room ${r}`, home: "Home", signOut: "Sign out", language: "Language",
  howCanWeHelp: "How can we help?", anythingElse: "Anything else?", placeholderMic: "Type or speak, in any language",
  placeholder: "Tell us in any language", reading: "Reading your message…", ticked: "We ticked what you asked for. Tap to change.",
  orTap: "Or tap what you need:", inEnglish: "In English:",
  groups: { "For your room": "For your room", "Something's not working": "Something's not working", "Front desk": "Front desk" },
  tiles: { towels: "Towels", pillows: "Pillows", toiletries: "Toiletries", drinks: "Drinks", cleaning: "Cleaning", hotWater: "Water", temperature: "Heating / AC", tvWifi: "TV / Wi-Fi", broken: "Broken", lateCheckout: "Late checkout", taxi: "Taxi", luggage: "Luggage" },
  send: "Send request", sendItems: (n) => `Send request · ${n} items`, sending: "Sending…", dialBefore: "Prefer to talk? Dial", dialAfter: "from your room phone",
  cat: { Maintenance: "Maintenance", Housekeeping: "Housekeeping", "Front desk": "Front desk" },
  sendingBack: (n) => `Sending ${n} back`, notSortedYet: "Sorry it's not sorted yet. It's now a priority.",
  receivedTitle: "Request received", receivedSub: "We've got it and we're finding the right person.",
  onIt: (n) => `${n} is on it`, hasIt: (n, d) => `${n} from ${d} has your request.`, onTheWayTitle: (n) => `${n} is on the way`,
  heading: (r) => `Heading to room ${r} now.`, thanksChecking: "Thanks for checking", gladSorted: "Glad it's sorted. The team will close it off.",
  markedFixed: "Marked as fixed", checkAllGood: "Can you check it's all good?", allSorted: "All sorted", enjoyStay: "Thanks for letting us know. Enjoy your stay.",
  removedTitle: "This request was removed", removedSub: "The team closed it off. You can send a new one any time.", loading: "Loading…",
  dangerTitle: "If anyone is in danger, call reception now.", dangerSub: "We've alerted the duty manager and someone is coming now.",
  takingLonger: "Taking longer than planned. The duty manager has been told.", aimBy: "We aim to sort this by",
  isItFixed: "Is it fixed?", yesAllGood: "Yes, all good", notYet: "Not yet", sentInEnglish: "Sent to the team in English:", loggedByDesk: "logged by the front desk",
  stepReceived: "Request received", stepPassed: (n) => `Passed to ${n}`, stepOnTheWay: "On the way", stepFixed: "Marked as fixed", stepClosed: "Closed by the team",
  ratingWords: ["", "Poor", "Not great", "OK", "Good", "Excellent"], howWas: (n) => `How was ${n}'s help?`, thanksRating: (n) => `Thanks for rating ${n}`,
  sorryDM: "Sorry it wasn't better. The duty manager will be in touch.", passedOn: (n) => `We've passed it on to ${n}.`, willPass: (n) => `We'll pass it on to ${n}.`,
  thanksFeedback: "Thanks for your feedback", done: "Done", notNow: "Not now", wentWell: "What went well?", wentWrong: "What went wrong?",
  anythingToAdd: "Anything else to add? (optional)", tellMore: "Tell us more (optional)", submit: "Submit",
  tags: {},
  tipAsk: (n) => `Leave ${n} a tip?`, noCash: "No cash needed. Optional.", payWith: (a) => (a ? `Pay £${a} with Apple Pay` : "Pay with Apple Pay"),
  paying: "Paying…", tipSent: (a, n) => `£${a} tip sent to ${n}.`, thankYou: "Thank you!", demoNoMoney: "Demo: no money is taken.",
};

const ar: Dict = {
  guestRequests: "طلبات النزلاء", welcome: "أهلاً بك", signInSub: "أدخل اسم العائلة في حجزك ورقم غرفتك.",
  surname: "اسم العائلة", roomNumber: "رقم الغرفة", continue: "متابعة", signingIn: "جارٍ تسجيل الدخول…",
  notFound: "لم نجد هذا الحجز. تحقق من اسم العائلة ورقم الغرفة.", enterBoth: "أدخل اسم العائلة ورقم الغرفة.",
  genericError: "حدث خطأ ما. حاول مرة أخرى.",
  room: (r) => `غرفة ${r}`, home: "الرئيسية", signOut: "خروج", language: "اللغة",
  howCanWeHelp: "كيف يمكننا مساعدتك؟", anythingElse: "هل تحتاج شيئاً آخر؟", placeholderMic: "اكتب بأي لغة، أو اضغط على الميكروفون",
  placeholder: "اكتب بأي لغة", reading: "نقرأ رسالتك…", ticked: "حددنا ما طلبته. اضغط للتغيير.",
  orTap: "أو اختر ما تحتاجه:", inEnglish: "بالإنجليزية:",
  groups: { "For your room": "لغرفتك", "Something's not working": "شيء لا يعمل", "Front desk": "مكتب الاستقبال" },
  tiles: { towels: "مناشف", pillows: "وسائد", toiletries: "مستلزمات", drinks: "مشروبات", cleaning: "تنظيف", hotWater: "الماء", temperature: "تدفئة / تكييف", tvWifi: "تلفاز / واي فاي", broken: "عطل", lateCheckout: "مغادرة متأخرة", taxi: "تاكسي", luggage: "أمتعة" },
  send: "إرسال الطلب", sendItems: (n) => `إرسال الطلب · ${n} عناصر`, sending: "جارٍ الإرسال…", dialBefore: "تفضّل التحدث؟ اطلب", dialAfter: "من هاتف غرفتك",
  cat: { Maintenance: "الصيانة", Housekeeping: "التدبير المنزلي", "Front desk": "الاستقبال" },
  sendingBack: (n) => `سنرسل ${n} مرة أخرى`, notSortedYet: "نأسف لأن المشكلة لم تُحل بعد. أصبحت الآن أولوية.",
  receivedTitle: "تم استلام الطلب", receivedSub: "استلمنا طلبك ونبحث عن الشخص المناسب.",
  onIt: (n) => `${n} يعمل على طلبك`, hasIt: (n, d) => `${n} من ${d} لديه طلبك.`, onTheWayTitle: (n) => `${n} في الطريق`,
  heading: (r) => `في الطريق إلى الغرفة ${r} الآن.`, thanksChecking: "شكراً على التحقق", gladSorted: "يسعدنا أن المشكلة حُلّت. سيغلق الفريق الطلب.",
  markedFixed: "تم الإصلاح", checkAllGood: "هل يمكنك التأكد أن كل شيء على ما يرام؟", allSorted: "تم كل شيء", enjoyStay: "شكراً لإخبارنا. استمتع بإقامتك.",
  removedTitle: "تمت إزالة هذا الطلب", removedSub: "أغلقه الفريق. يمكنك إرسال طلب جديد في أي وقت.", loading: "جارٍ التحميل…",
  dangerTitle: "إذا كان أحد في خطر، اتصل بالاستقبال الآن.", dangerSub: "أبلغنا المدير المناوب وهناك من في طريقه إليك الآن.",
  takingLonger: "يستغرق الأمر وقتاً أطول من المتوقع. تم إبلاغ المدير المناوب.", aimBy: "نسعى لإنجاز ذلك بحلول",
  isItFixed: "هل تم الإصلاح؟", yesAllGood: "نعم، كل شيء جيد", notYet: "ليس بعد", sentInEnglish: "أُرسل إلى الفريق بالإنجليزية:", loggedByDesk: "سجّله الاستقبال",
  stepReceived: "تم استلام الطلب", stepPassed: (n) => `أُحيل إلى ${n}`, stepOnTheWay: "في الطريق", stepFixed: "تم الإصلاح", stepClosed: "أغلقه الفريق",
  ratingWords: ["", "سيئ", "ليس جيداً", "مقبول", "جيد", "ممتاز"], howWas: (n) => `كيف كانت مساعدة ${n}؟`, thanksRating: (n) => `شكراً لتقييم ${n}`,
  sorryDM: "نأسف لأن التجربة لم تكن أفضل. سيتواصل معك المدير المناوب.", passedOn: (n) => `أبلغنا ${n}.`, willPass: (n) => `سنبلغ ${n}.`,
  thanksFeedback: "شكراً على ملاحظاتك", done: "تم", notNow: "ليس الآن", wentWell: "ما الذي أعجبك؟", wentWrong: "ما الذي لم يعجبك؟",
  anythingToAdd: "هل تود إضافة شيء؟ (اختياري)", tellMore: "أخبرنا المزيد (اختياري)", submit: "إرسال",
  tags: { Quick: "سريع", Friendly: "ودود", "Fixed first time": "أُصلح من أول مرة", "Kept me updated": "أبقاني على اطلاع", "Went the extra mile": "بذل جهداً إضافياً", "Too slow": "بطيء جداً", "Not fully fixed": "لم يُصلح بالكامل", "No updates": "لا تحديثات", "Had to chase": "اضطررت للمتابعة", "Staff attitude": "تعامل الموظفين" },
  tipAsk: (n) => `هل تود ترك إكرامية لـ ${n}؟`, noCash: "لا حاجة للنقد. اختياري.", payWith: (a) => (a ? `ادفع £${a} عبر Apple Pay` : "ادفع عبر Apple Pay"),
  paying: "جارٍ الدفع…", tipSent: (a, n) => `أُرسلت إكرامية £${a} إلى ${n}.`, thankYou: "شكراً لك!", demoNoMoney: "عرض تجريبي: لا يتم خصم أي مبلغ.",
};

const es: Dict = {
  guestRequests: "Solicitudes de huéspedes", welcome: "Bienvenido", signInSub: "Introduce el apellido de tu reserva y tu número de habitación.",
  surname: "Apellido", roomNumber: "Número de habitación", continue: "Continuar", signingIn: "Entrando…",
  notFound: "No encontramos esa reserva. Revisa tu apellido y número de habitación.", enterBoth: "Introduce tu apellido y número de habitación.",
  genericError: "Algo salió mal. Inténtalo de nuevo.",
  room: (r) => `Habitación ${r}`, home: "Inicio", signOut: "Salir", language: "Idioma",
  howCanWeHelp: "¿En qué podemos ayudarte?", anythingElse: "¿Algo más?", placeholderMic: "Escríbenos en cualquier idioma o toca el micrófono",
  placeholder: "Escríbenos en cualquier idioma", reading: "Leyendo tu mensaje…", ticked: "Hemos marcado lo que pediste. Toca para cambiar.",
  orTap: "O toca lo que necesitas:", inEnglish: "En inglés:",
  groups: { "For your room": "Para tu habitación", "Something's not working": "Algo no funciona", "Front desk": "Recepción" },
  tiles: { towels: "Toallas", pillows: "Almohadas", toiletries: "Aseo", drinks: "Bebidas", cleaning: "Limpieza", hotWater: "Agua", temperature: "Calefacción / AC", tvWifi: "TV / Wi-Fi", broken: "Avería", lateCheckout: "Salida tarde", taxi: "Taxi", luggage: "Equipaje" },
  send: "Enviar solicitud", sendItems: (n) => `Enviar solicitud · ${n} artículos`, sending: "Enviando…", dialBefore: "¿Prefieres hablar? Marca el", dialAfter: "desde el teléfono de tu habitación",
  cat: { Maintenance: "Mantenimiento", Housekeeping: "Limpieza", "Front desk": "Recepción" },
  sendingBack: (n) => `${n} vuelve en camino`, notSortedYet: "Sentimos que no esté resuelto. Ahora es una prioridad.",
  receivedTitle: "Solicitud recibida", receivedSub: "La tenemos y estamos buscando a la persona adecuada.",
  onIt: (n) => `${n} se encarga`, hasIt: (n, d) => `${n}, de ${d}, tiene tu solicitud.`, onTheWayTitle: (n) => `${n} está en camino`,
  heading: (r) => `De camino a la habitación ${r}.`, thanksChecking: "Gracias por comprobarlo", gladSorted: "Nos alegra que esté resuelto. El equipo la cerrará.",
  markedFixed: "Marcado como resuelto", checkAllGood: "¿Puedes comprobar que todo está bien?", allSorted: "Todo resuelto", enjoyStay: "Gracias por avisarnos. Disfruta tu estancia.",
  removedTitle: "Esta solicitud se eliminó", removedSub: "El equipo la cerró. Puedes enviar otra cuando quieras.", loading: "Cargando…",
  dangerTitle: "Si alguien está en peligro, llama a recepción ahora.", dangerSub: "Hemos avisado al responsable de turno y alguien va en camino.",
  takingLonger: "Está tardando más de lo previsto. El responsable de turno está avisado.", aimBy: "Queremos resolverlo antes de las",
  isItFixed: "¿Está resuelto?", yesAllGood: "Sí, todo bien", notYet: "Todavía no", sentInEnglish: "Enviado al equipo en inglés:", loggedByDesk: "registrado por recepción",
  stepReceived: "Solicitud recibida", stepPassed: (n) => `Asignada a ${n}`, stepOnTheWay: "En camino", stepFixed: "Marcado como resuelto", stepClosed: "Cerrada por el equipo",
  ratingWords: ["", "Mala", "Regular", "Correcta", "Buena", "Excelente"], howWas: (n) => `¿Qué tal te ayudó ${n}?`, thanksRating: (n) => `Gracias por valorar a ${n}`,
  sorryDM: "Sentimos que no fuera mejor. El responsable de turno se pondrá en contacto.", passedOn: (n) => `Se lo hemos transmitido a ${n}.`, willPass: (n) => `Se lo transmitiremos a ${n}.`,
  thanksFeedback: "Gracias por tu opinión", done: "Listo", notNow: "Ahora no", wentWell: "¿Qué salió bien?", wentWrong: "¿Qué salió mal?",
  anythingToAdd: "¿Algo más que añadir? (opcional)", tellMore: "Cuéntanos más (opcional)", submit: "Enviar",
  tags: { Quick: "Rápido", Friendly: "Amable", "Fixed first time": "Resuelto a la primera", "Kept me updated": "Me mantuvo informado", "Went the extra mile": "Fue más allá", "Too slow": "Demasiado lento", "Not fully fixed": "No del todo resuelto", "No updates": "Sin novedades", "Had to chase": "Tuve que insistir", "Staff attitude": "Actitud del personal" },
  tipAsk: (n) => `¿Dejar propina a ${n}?`, noCash: "Sin efectivo. Opcional.", payWith: (a) => (a ? `Pagar £${a} con Apple Pay` : "Pagar con Apple Pay"),
  paying: "Pagando…", tipSent: (a, n) => `Propina de £${a} enviada a ${n}.`, thankYou: "¡Gracias!", demoNoMoney: "Demo: no se cobra nada.",
};



const zh: Dict = {
  guestRequests: "客人服务", welcome: "欢迎", signInSub: "请输入预订时的姓氏和房间号。",
  surname: "姓氏", roomNumber: "房间号", continue: "继续", signingIn: "正在登录…",
  notFound: "未找到该预订。请检查姓氏和房间号。", enterBoth: "请输入姓氏和房间号。",
  genericError: "出了点问题，请重试。",
  room: (r) => `${r} 号房`, home: "首页", signOut: "退出", language: "语言",
  howCanWeHelp: "需要什么帮助？", anythingElse: "还需要什么吗？", placeholderMic: "可打字或语音，任何语言",
  placeholder: "可用任何语言输入", reading: "正在读取您的消息…", ticked: "已为您勾选所需内容，点击可更改。",
  orTap: "或点击所需服务：", inEnglish: "英文：",
  groups: { "For your room": "客房用品", "Something's not working": "设施故障", "Front desk": "前台服务" },
  tiles: { towels: "毛巾", pillows: "枕头", toiletries: "洗漱用品", drinks: "饮品", cleaning: "打扫", hotWater: "用水", temperature: "暖气 / 空调", tvWifi: "电视 / Wi-Fi", broken: "故障", lateCheckout: "延迟退房", taxi: "出租车", luggage: "行李" },
  send: "发送请求", sendItems: (n) => `发送请求 · ${n} 项`, sending: "正在发送…", dialBefore: "想直接通话？用客房电话拨", dialAfter: "",
  cat: { Maintenance: "维修部", Housekeeping: "客房部", "Front desk": "前台" },
  sendingBack: (n) => `${n} 将再次前来`, notSortedYet: "抱歉还未解决，现已优先处理。",
  receivedTitle: "已收到请求", receivedSub: "我们已收到，正在安排合适的人员。",
  onIt: (n) => `${n} 正在处理`, hasIt: (n, d) => `${d}的 ${n} 已接手您的请求。`, onTheWayTitle: (n) => `${n} 正在路上`,
  heading: (r) => `正前往 ${r} 号房。`, thanksChecking: "感谢确认", gladSorted: "很高兴问题已解决，团队会关闭此请求。",
  markedFixed: "已标记为解决", checkAllGood: "请确认一切是否正常？", allSorted: "已全部解决", enjoyStay: "感谢告知，祝您入住愉快。",
  removedTitle: "此请求已删除", removedSub: "团队已关闭此请求，您可随时发送新请求。", loading: "加载中…",
  dangerTitle: "如有人身危险，请立即致电前台。", dangerSub: "我们已通知值班经理，有人正在赶来。",
  takingLonger: "处理时间比预期长，已通知值班经理。", aimBy: "我们力争在此时间前解决：",
  isItFixed: "问题解决了吗？", yesAllGood: "是的，一切正常", notYet: "还没有", sentInEnglish: "已用英文发送给团队：", loggedByDesk: "由前台登记",
  stepReceived: "已收到请求", stepPassed: (n) => `已转交 ${n}`, stepOnTheWay: "正在路上", stepFixed: "已标记为解决", stepClosed: "团队已关闭",
  ratingWords: ["", "很差", "一般偏差", "还行", "好", "非常好"], howWas: (n) => `${n} 的服务如何？`, thanksRating: (n) => `感谢您为 ${n} 评分`,
  sorryDM: "抱歉体验不够好，值班经理会与您联系。", passedOn: (n) => `我们已转告 ${n}。`, willPass: (n) => `我们会转告 ${n}。`,
  thanksFeedback: "感谢您的反馈", done: "完成", notNow: "以后再说", wentWell: "哪些方面做得好？", wentWrong: "哪些方面有问题？",
  anythingToAdd: "还有补充吗？（可选）", tellMore: "请告诉我们更多（可选）", submit: "提交",
  tags: { Quick: "快速", Friendly: "友好", "Fixed first time": "一次解决", "Kept me updated": "及时告知进展", "Went the extra mile": "超出预期", "Too slow": "太慢", "Not fully fixed": "未完全解决", "No updates": "没有进展通知", "Had to chase": "需要反复催促", "Staff attitude": "员工态度" },
  tipAsk: (n) => `给 ${n} 小费吗？`, noCash: "无需现金，可选。", payWith: (a) => (a ? `用 Apple Pay 支付 £${a}` : "用 Apple Pay 支付"),
  paying: "正在支付…", tipSent: (a, n) => `已向 ${n} 支付 £${a} 小费。`, thankYou: "谢谢！", demoNoMoney: "演示：不会实际扣款。",
};

const hi: Dict = {
  guestRequests: "अतिथि अनुरोध", welcome: "स्वागत है", signInSub: "अपनी बुकिंग का उपनाम और कमरा नंबर डालें।",
  surname: "उपनाम", roomNumber: "कमरा नंबर", continue: "आगे बढ़ें", signingIn: "साइन इन हो रहा है…",
  notFound: "यह बुकिंग नहीं मिली। उपनाम और कमरा नंबर जाँचें।", enterBoth: "अपना उपनाम और कमरा नंबर डालें।",
  genericError: "कुछ गड़बड़ हुई। फिर से कोशिश करें।",
  room: (r) => `कमरा ${r}`, home: "होम", signOut: "साइन आउट", language: "भाषा",
  howCanWeHelp: "हम कैसे मदद करें?", anythingElse: "और कुछ?", placeholderMic: "किसी भी भाषा में लिखें या बोलें",
  placeholder: "किसी भी भाषा में लिखें", reading: "आपका संदेश पढ़ रहे हैं…", ticked: "आपकी ज़रूरत हमने चुन ली है। बदलने के लिए टैप करें।",
  orTap: "या ज़रूरत पर टैप करें:", inEnglish: "अंग्रेज़ी में:",
  groups: { "For your room": "आपके कमरे के लिए", "Something's not working": "कुछ काम नहीं कर रहा", "Front desk": "फ्रंट डेस्क" },
  tiles: { towels: "तौलिये", pillows: "तकिये", toiletries: "टॉयलेटरीज़", drinks: "पेय", cleaning: "सफ़ाई", hotWater: "पानी", temperature: "हीटिंग / एसी", tvWifi: "टीवी / वाई-फ़ाई", broken: "ख़राब", lateCheckout: "देर से चेकआउट", taxi: "टैक्सी", luggage: "सामान" },
  send: "अनुरोध भेजें", sendItems: (n) => `अनुरोध भेजें · ${n} चीज़ें`, sending: "भेज रहे हैं…", dialBefore: "बात करना चाहेंगे? कमरे के फ़ोन से", dialAfter: "डायल करें",
  cat: { Maintenance: "मेंटेनेंस", Housekeeping: "हाउसकीपिंग", "Front desk": "फ्रंट डेस्क" },
  sendingBack: (n) => `${n} फिर से आ रहे हैं`, notSortedYet: "माफ़ कीजिए, अभी ठीक नहीं हुआ। अब यह प्राथमिकता है।",
  receivedTitle: "अनुरोध मिल गया", receivedSub: "हमें मिल गया है, सही व्यक्ति ढूँढ रहे हैं।",
  onIt: (n) => `${n} इस पर काम कर रहे हैं`, hasIt: (n, d) => `${d} से ${n} के पास आपका अनुरोध है।`, onTheWayTitle: (n) => `${n} रास्ते में हैं`,
  heading: (r) => `कमरा ${r} की ओर आ रहे हैं।`, thanksChecking: "जाँचने के लिए धन्यवाद", gladSorted: "ख़ुशी है कि ठीक हो गया। टीम इसे बंद कर देगी।",
  markedFixed: "ठीक किया गया", checkAllGood: "क्या आप जाँच सकते हैं कि सब ठीक है?", allSorted: "सब ठीक हो गया", enjoyStay: "बताने के लिए धन्यवाद। अपने ठहरने का आनंद लें।",
  removedTitle: "यह अनुरोध हटा दिया गया", removedSub: "टीम ने इसे बंद कर दिया। आप कभी भी नया भेज सकते हैं।", loading: "लोड हो रहा है…",
  dangerTitle: "अगर कोई ख़तरे में है, तो अभी रिसेप्शन को कॉल करें।", dangerSub: "हमने ड्यूटी मैनेजर को बता दिया है, कोई अभी आ रहा है।",
  takingLonger: "उम्मीद से ज़्यादा समय लग रहा है। ड्यूटी मैनेजर को बता दिया गया है।", aimBy: "हम इसे इस समय तक ठीक करने का लक्ष्य रखते हैं:",
  isItFixed: "क्या यह ठीक हो गया?", yesAllGood: "हाँ, सब ठीक है", notYet: "अभी नहीं", sentInEnglish: "टीम को अंग्रेज़ी में भेजा गया:", loggedByDesk: "फ्रंट डेस्क ने दर्ज किया",
  stepReceived: "अनुरोध मिल गया", stepPassed: (n) => `${n} को सौंपा गया`, stepOnTheWay: "रास्ते में", stepFixed: "ठीक किया गया", stepClosed: "टीम ने बंद किया",
  ratingWords: ["", "ख़राब", "ठीक नहीं", "ठीक है", "अच्छा", "बहुत बढ़िया"], howWas: (n) => `${n} की मदद कैसी रही?`, thanksRating: (n) => `${n} को रेटिंग देने के लिए धन्यवाद`,
  sorryDM: "माफ़ कीजिए, बेहतर नहीं रहा। ड्यूटी मैनेजर आपसे संपर्क करेंगे।", passedOn: (n) => `हमने ${n} तक पहुँचा दिया है।`, willPass: (n) => `हम ${n} तक पहुँचा देंगे।`,
  thanksFeedback: "आपकी राय के लिए धन्यवाद", done: "हो गया", notNow: "अभी नहीं", wentWell: "क्या अच्छा रहा?", wentWrong: "क्या ग़लत हुआ?",
  anythingToAdd: "कुछ और जोड़ना है? (वैकल्पिक)", tellMore: "हमें और बताएँ (वैकल्पिक)", submit: "भेजें",
  tags: { Quick: "तेज़", Friendly: "मिलनसार", "Fixed first time": "पहली बार में ठीक", "Kept me updated": "जानकारी देते रहे", "Went the extra mile": "उम्मीद से बढ़कर", "Too slow": "बहुत धीमा", "Not fully fixed": "पूरी तरह ठीक नहीं", "No updates": "कोई जानकारी नहीं", "Had to chase": "बार-बार याद दिलाना पड़ा", "Staff attitude": "स्टाफ़ का व्यवहार" },
  tipAsk: (n) => `${n} को टिप देना चाहेंगे?`, noCash: "नकद की ज़रूरत नहीं। वैकल्पिक।", payWith: (a) => (a ? `Apple Pay से £${a} दें` : "Apple Pay से दें"),
  paying: "भुगतान हो रहा है…", tipSent: (a, n) => `${n} को £${a} टिप भेजी गई।`, thankYou: "धन्यवाद!", demoNoMoney: "डेमो: कोई पैसा नहीं कटता।",
};

export const DICTS: Record<Lang, Dict> = { en, zh, hi, es, ar };

// The guest's choice, kept on this phone only (a per-viewer convenience).
const KEY = "gr-guest-lang";
const EVENT = "gr-lang-change";
const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY);
    return LANGS.some((l) => l.code === v) ? (v as Lang) : "en";
  } catch {
    return "en";
  }
};
export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
export const useLang = () => useSyncExternalStore(subscribe, read, () => "en" as Lang);

export const LangContext = createContext<Dict>(en);
export const useL = () => useContext(LangContext);
