/**
 * Textos del aviso de privacidad y de las normas de comunidad (RF-04, anteproyecto 15.1).
 * Se muestran en `src/app/legal/*` y se enlazan desde el registro.
 * Son un borrador: el Product Owner los revisa antes de publicar la app.
 */

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

export const PrivacyNotice: LegalDocument = {
  title: "Aviso de privacidad",
  updatedAt: "12 de octubre de 2026",
  intro:
    "En Kampus cuidamos tus datos. Este aviso explica qué información recabamos, para qué la usamos y cómo puedes controlarla, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
  sections: [
    {
      title: "Quién es responsable de tus datos",
      paragraphs: [
        "Kampus es un proyecto académico desarrollado por estudiantes de la Universidad Tecnológica de Torreón. El equipo de Kampus es responsable del tratamiento de tus datos personales.",
      ],
    },
    {
      title: "Qué datos recabamos",
      bullets: [
        "Nombre, apellido y correo institucional.",
        "Institución, carrera, semestre, intereses y biografía.",
        "Las fotos que subes a tu perfil, a tus chats y a tus grupos.",
        "Tu zona declarada (campus o colonia) y, solo si activas \"Cerca de ti\", una celda aproximada de 1 km.",
        "Tus mensajes, matches, grupos, bloqueos y reportes.",
      ],
    },
    {
      title: "Para qué los usamos",
      bullets: [
        "Verificar que perteneces a la UTT, la UAdeC o el Tecnológico de la Laguna.",
        "Mostrarte perfiles afines y generar matches.",
        "Permitir el chat, las videollamadas y los grupos.",
        "Atender reportes y mantener un entorno seguro.",
      ],
      paragraphs: [
        "No vendemos tus datos ni los usamos con fines publicitarios.",
      ],
    },
    {
      title: "Tu ubicación",
      paragraphs: [
        "Nunca guardamos tu ubicación exacta. Si activas \"Cerca de ti\", tu celular calcula una celda de unos 1 km y solo esa celda se envía a nuestros servidores. Puedes desactivarlo y borrarla cuando quieras.",
        "Tu ubicación puntual solo viaja si tú decides compartirla en un chat con un match, y siempre te pedimos confirmación antes.",
      ],
    },
    {
      title: "Tus fotos",
      paragraphs: [
        "Las fotos se guardan en un almacenamiento privado y solo las ven usuarios verificados. Se muestran mediante enlaces temporales que caducan.",
      ],
    },
    {
      title: "Con quién compartimos datos",
      paragraphs: [
        "Solo con los proveedores necesarios para que la app funcione (alojamiento, almacenamiento de imágenes, envío de correos y videollamadas), y únicamente para ese fin.",
      ],
    },
    {
      title: "Tus derechos",
      paragraphs: [
        "Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos (derechos ARCO). Puedes editar tu perfil en cualquier momento y eliminar tu cuenta desde Ajustes: tus datos personales y fotos se borran en un máximo de 72 horas.",
      ],
    },
    {
      title: "Cambios a este aviso",
      paragraphs: [
        "Si cambiamos este aviso, te lo avisaremos dentro de la app antes de que entre en vigor.",
      ],
    },
  ],
};

export const CommunityGuidelines: LegalDocument = {
  title: "Normas de comunidad",
  updatedAt: "12 de octubre de 2026",
  intro:
    "Kampus es un espacio para conocer a otros estudiantes de la Comarca Lagunera. Estas normas existen para que todas las personas se sientan seguras y bienvenidas.",
  sections: [
    {
      title: "Sé tú",
      bullets: [
        "Usa tu nombre real y fotos tuyas.",
        "No te hagas pasar por otra persona ni crees perfiles falsos.",
        "Una cuenta por persona.",
      ],
    },
    {
      title: "Respeta a los demás",
      bullets: [
        "No acoses, amenaces ni insistas cuando alguien no quiere seguir la conversación.",
        "No publiques lenguaje de odio ni discriminación por origen, género, orientación, religión, discapacidad o cualquier otra condición.",
        "No compartas datos o fotos de otras personas sin su permiso.",
      ],
    },
    {
      title: "Contenido permitido",
      bullets: [
        "Kampus es una comunidad universitaria: no se permite contenido sexual, explícito ni para adultos (+18).",
        "No se permite contenido violento, ilegal ni que promueva el consumo de drogas.",
        "No uses la app para vender, hacer publicidad o enviar spam.",
      ],
    },
    {
      title: "Cuida tu seguridad",
      bullets: [
        "Comparte tu ubicación solo con personas de confianza.",
        "Si quedas en persona, elige un lugar público, como tu campus.",
        "Nunca compartas contraseñas ni datos bancarios.",
      ],
    },
    {
      title: "Bloquear y reportar",
      paragraphs: [
        "Si alguien te incomoda, puedes bloquearlo: desaparece de tu descubrimiento, tus matches y tus chats. Si alguien rompe estas normas, repórtalo; el equipo de moderación revisa cada reporte en un máximo de 48 horas.",
      ],
    },
    {
      title: "Consecuencias",
      paragraphs: [
        "Según la gravedad, podemos retirar contenido, suspender temporalmente la cuenta o eliminarla de forma definitiva.",
      ],
    },
  ],
};
