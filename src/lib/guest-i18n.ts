"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Category } from "@/lib/requests";
import type { OptionId } from "@/lib/options";

// The guest app's own words, in the guest's language. Staff always see English
// (the server translates what guests type). Names stay as they are.

export const LANGS = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇦🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
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
  howCanWeHelp: "How can we help?", anythingElse: "Anything else?", placeholderMic: "Tell us in any language, or tap the mic",
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

const pt: Dict = {
  guestRequests: "Pedidos de hóspedes", welcome: "Bem-vindo", signInSub: "Digite o sobrenome da reserva e o número do quarto.",
  surname: "Sobrenome", roomNumber: "Número do quarto", continue: "Continuar", signingIn: "Entrando…",
  notFound: "Não encontramos essa reserva. Confira o sobrenome e o número do quarto.", enterBoth: "Digite o sobrenome e o número do quarto.",
  genericError: "Algo deu errado. Tente novamente.",
  room: (r) => `Quarto ${r}`, home: "Início", signOut: "Sair", language: "Idioma",
  howCanWeHelp: "Como podemos ajudar?", anythingElse: "Mais alguma coisa?", placeholderMic: "Escreva em qualquer idioma ou toque no microfone",
  placeholder: "Escreva em qualquer idioma", reading: "Lendo sua mensagem…", ticked: "Marcamos o que você pediu. Toque para mudar.",
  orTap: "Ou toque no que precisa:", inEnglish: "Em inglês:",
  groups: { "For your room": "Para o seu quarto", "Something's not working": "Algo não funciona", "Front desk": "Recepção" },
  tiles: { towels: "Toalhas", pillows: "Travesseiros", toiletries: "Higiene", drinks: "Bebidas", cleaning: "Limpeza", hotWater: "Água", temperature: "Aquecimento / AC", tvWifi: "TV / Wi-Fi", broken: "Quebrado", lateCheckout: "Check-out tarde", taxi: "Táxi", luggage: "Bagagem" },
  send: "Enviar pedido", sendItems: (n) => `Enviar pedido · ${n} itens`, sending: "Enviando…", dialBefore: "Prefere falar? Disque", dialAfter: "no telefone do quarto",
  cat: { Maintenance: "Manutenção", Housekeeping: "Governança", "Front desk": "Recepção" },
  sendingBack: (n) => `${n} vai voltar`, notSortedYet: "Desculpe, ainda não foi resolvido. Agora é prioridade.",
  receivedTitle: "Pedido recebido", receivedSub: "Recebemos e estamos encontrando a pessoa certa.",
  onIt: (n) => `${n} está cuidando disso`, hasIt: (n, d) => `${n}, da ${d}, está com o seu pedido.`, onTheWayTitle: (n) => `${n} está a caminho`,
  heading: (r) => `A caminho do quarto ${r}.`, thanksChecking: "Obrigado por verificar", gladSorted: "Que bom que foi resolvido. A equipe vai encerrar o pedido.",
  markedFixed: "Marcado como resolvido", checkAllGood: "Pode verificar se está tudo certo?", allSorted: "Tudo resolvido", enjoyStay: "Obrigado por avisar. Aproveite a estadia.",
  removedTitle: "Este pedido foi removido", removedSub: "A equipe encerrou o pedido. Você pode enviar outro quando quiser.", loading: "Carregando…",
  dangerTitle: "Se alguém estiver em perigo, ligue para a recepção agora.", dangerSub: "Avisamos o gerente de plantão e alguém está a caminho.",
  takingLonger: "Está demorando mais que o previsto. O gerente de plantão foi avisado.", aimBy: "Queremos resolver até",
  isItFixed: "Foi resolvido?", yesAllGood: "Sim, tudo certo", notYet: "Ainda não", sentInEnglish: "Enviado à equipe em inglês:", loggedByDesk: "registrado pela recepção",
  stepReceived: "Pedido recebido", stepPassed: (n) => `Encaminhado para ${n}`, stepOnTheWay: "A caminho", stepFixed: "Marcado como resolvido", stepClosed: "Encerrado pela equipe",
  ratingWords: ["", "Ruim", "Fraco", "OK", "Bom", "Excelente"], howWas: (n) => `Como foi a ajuda de ${n}?`, thanksRating: (n) => `Obrigado por avaliar ${n}`,
  sorryDM: "Desculpe por não ter sido melhor. O gerente de plantão vai entrar em contato.", passedOn: (n) => `Repassamos para ${n}.`, willPass: (n) => `Vamos repassar para ${n}.`,
  thanksFeedback: "Obrigado pelo feedback", done: "Pronto", notNow: "Agora não", wentWell: "O que foi bom?", wentWrong: "O que deu errado?",
  anythingToAdd: "Algo a acrescentar? (opcional)", tellMore: "Conte mais (opcional)", submit: "Enviar",
  tags: { Quick: "Rápido", Friendly: "Simpático", "Fixed first time": "Resolvido de primeira", "Kept me updated": "Me manteve informado", "Went the extra mile": "Foi além", "Too slow": "Muito lento", "Not fully fixed": "Não totalmente resolvido", "No updates": "Sem atualizações", "Had to chase": "Tive que insistir", "Staff attitude": "Atitude da equipe" },
  tipAsk: (n) => `Deixar uma gorjeta para ${n}?`, noCash: "Sem dinheiro em espécie. Opcional.", payWith: (a) => (a ? `Pagar £${a} com Apple Pay` : "Pagar com Apple Pay"),
  paying: "Pagando…", tipSent: (a, n) => `Gorjeta de £${a} enviada para ${n}.`, thankYou: "Obrigado!", demoNoMoney: "Demo: nenhum valor é cobrado.",
};

const cs: Dict = {
  guestRequests: "Požadavky hostů", welcome: "Vítejte", signInSub: "Zadejte příjmení z rezervace a číslo pokoje.",
  surname: "Příjmení", roomNumber: "Číslo pokoje", continue: "Pokračovat", signingIn: "Přihlašuji…",
  notFound: "Tuto rezervaci jsme nenašli. Zkontrolujte příjmení a číslo pokoje.", enterBoth: "Zadejte příjmení a číslo pokoje.",
  genericError: "Něco se pokazilo. Zkuste to znovu.",
  room: (r) => `Pokoj ${r}`, home: "Domů", signOut: "Odhlásit", language: "Jazyk",
  howCanWeHelp: "Jak vám můžeme pomoci?", anythingElse: "Ještě něco?", placeholderMic: "Napište v jakémkoli jazyce, nebo klepněte na mikrofon",
  placeholder: "Napište v jakémkoli jazyce", reading: "Čteme vaši zprávu…", ticked: "Označili jsme, co jste chtěli. Klepnutím změníte.",
  orTap: "Nebo klepněte, co potřebujete:", inEnglish: "Anglicky:",
  groups: { "For your room": "Na pokoj", "Something's not working": "Něco nefunguje", "Front desk": "Recepce" },
  tiles: { towels: "Ručníky", pillows: "Polštáře", toiletries: "Hygiena", drinks: "Nápoje", cleaning: "Úklid", hotWater: "Voda", temperature: "Topení / klima", tvWifi: "TV / Wi-Fi", broken: "Porucha", lateCheckout: "Pozdní odjezd", taxi: "Taxi", luggage: "Zavazadla" },
  send: "Odeslat požadavek", sendItems: (n) => `Odeslat požadavek · ${n} položky`, sending: "Odesílám…", dialBefore: "Raději zavoláte? Vytočte", dialAfter: "z telefonu na pokoji",
  cat: { Maintenance: "Údržba", Housekeeping: "Úklid", "Front desk": "Recepce" },
  sendingBack: (n) => `${n} se vrací`, notSortedYet: "Omlouváme se, ještě to není vyřešené. Teď je to priorita.",
  receivedTitle: "Požadavek přijat", receivedSub: "Máme ho a hledáme správného člověka.",
  onIt: (n) => `${n} na tom pracuje`, hasIt: (n, d) => `${n} (${d}) má váš požadavek.`, onTheWayTitle: (n) => `${n} je na cestě`,
  heading: (r) => `Míří na pokoj ${r}.`, thanksChecking: "Díky za kontrolu", gladSorted: "Jsme rádi, že je to vyřešené. Tým požadavek uzavře.",
  markedFixed: "Označeno jako vyřešené", checkAllGood: "Můžete zkontrolovat, že je vše v pořádku?", allSorted: "Vše vyřešeno", enjoyStay: "Díky za zprávu. Užijte si pobyt.",
  removedTitle: "Tento požadavek byl odstraněn", removedSub: "Tým ho uzavřel. Nový můžete poslat kdykoli.", loading: "Načítám…",
  dangerTitle: "Pokud je někdo v nebezpečí, zavolejte hned na recepci.", dangerSub: "Upozornili jsme vedoucího směny a někdo je na cestě.",
  takingLonger: "Trvá to déle, než jsme plánovali. Vedoucí směny o tom ví.", aimBy: "Chceme to vyřešit do",
  isItFixed: "Je to vyřešené?", yesAllGood: "Ano, vše v pořádku", notYet: "Ještě ne", sentInEnglish: "Odesláno týmu anglicky:", loggedByDesk: "zapsala recepce",
  stepReceived: "Požadavek přijat", stepPassed: (n) => `Předáno: ${n}`, stepOnTheWay: "Na cestě", stepFixed: "Označeno jako vyřešené", stepClosed: "Uzavřeno týmem",
  ratingWords: ["", "Špatné", "Nic moc", "OK", "Dobré", "Výborné"], howWas: (n) => `Jak vám ${n} pomohl/a?`, thanksRating: (n) => `Díky za hodnocení: ${n}`,
  sorryDM: "Mrzí nás, že to nebylo lepší. Vedoucí směny se vám ozve.", passedOn: (n) => `Předali jsme to: ${n}.`, willPass: (n) => `Předáme to: ${n}.`,
  thanksFeedback: "Díky za zpětnou vazbu", done: "Hotovo", notNow: "Teď ne", wentWell: "Co se povedlo?", wentWrong: "Co se nepovedlo?",
  anythingToAdd: "Chcete něco dodat? (nepovinné)", tellMore: "Řekněte nám víc (nepovinné)", submit: "Odeslat",
  tags: { Quick: "Rychle", Friendly: "Přátelsky", "Fixed first time": "Hned napoprvé", "Kept me updated": "Průběžně informoval/a", "Went the extra mile": "Udělal/a víc", "Too slow": "Moc pomalé", "Not fully fixed": "Ne úplně vyřešené", "No updates": "Bez informací", "Had to chase": "Musel/a jsem urgovat", "Staff attitude": "Přístup personálu" },
  tipAsk: (n) => `Dát spropitné: ${n}?`, noCash: "Bez hotovosti. Nepovinné.", payWith: (a) => (a ? `Zaplatit £${a} přes Apple Pay` : "Zaplatit přes Apple Pay"),
  paying: "Platím…", tipSent: (a, n) => `Spropitné £${a} odesláno: ${n}.`, thankYou: "Děkujeme!", demoNoMoney: "Demo: nic se neplatí.",
};

export const DICTS: Record<Lang, Dict> = { en, ar, es, pt, cs };

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
