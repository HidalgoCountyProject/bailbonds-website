import { Language } from '../services/language.service';

export interface TranslationSet {
  [key: string]: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    // Header
    'language_toggle': 'Español',
    'home': 'Home',
    'services': 'Services',
    'location': 'Location',
    'testimonials': 'Testimonials',
    'faq': 'FAQ',
    'contact': 'Contact Us',
    'call_now': 'Call Now - 24/7',
    'payments': 'Payments',
    'missed_court': 'Missed Court',
    'careers': 'Careers',
    'blog': 'Blog',
    
    // Footer
    'footer.quick_links': 'Quick Links',
    'footer.process': 'Fast Release',
    'footer.social': 'Social Networks',
    'footer.rights': 'All rights reserved.',
    'footer.license': 'License',
    'footer.coming_soon': 'Coming soon',
    
    // Callback Request Tab
    'callback.tab_title': 'We\'ll Call You Back',
    'callback.form_title': 'Request a Callback',
    'callback.form_subtitle': 'Fill out this form and we\'ll contact you shortly',
    'callback.full_name': 'Guarantor/Your Full Name',
    'callback.dob': 'Arrested Person\'s Date of Birth (optional)',
    'callback.phone': 'Guarantor/Your Phone Number',
    'callback.message': 'Message (optional)',
    'callback.message_placeholder': 'Briefly tell us about your case (max 200 characters)',
    'callback.fullName.placeholder': 'John Smith',
    'callback.arrestedPerson.placeholder': 'Michael Johnson',
    'callback.phone.placeholder': '+XX (123) 456-7890',
    'callback.required': 'Required field',
    'callback.submit': 'Request Callback',
    'callback.success': 'Thank you! We will call you back soon.',
    'callback.error': 'There was an error submitting your request. Please try again.',
    
    // Hero Section
    'hero_title': 'Immediate Freedom with Affordable Bail Bonds in Hidalgo County',
    'hero_subtitle': 'Your trusted bondsman with over 30 years of combined experience in the bail bond process system. When time matters most, we guarantee the fastest release process possible.',
    'hero_call_button': 'Call Now: +1 956-867-9269',
    'hero_info_button': 'Request Information',
    
    // Promo Banner
    'promo_banner': 'Special offer: Free consultation and discount on your first bail bond. Call us today.',
    
    // Service Areas Section
    'service_areas_title': 'Serving All of Hidalgo County',
    'service_areas_across_jail': 'Just minutes away from Hidalgo County Jail (Cibolo Road)',
    'service_areas_licensed': 'Licensed in Hidalgo County #800107',
    'service_areas_cities': 'Alamo • Alton • Donna • Edcouch • Edinburg • Elsa • La Joya • La Villa • McAllen • Mercedes • Mission • Palmhurst • Penitas • Pharr • Progresso • San Juan • Sullivan • Weslaco, among other cities in Texas',
    
    // Features Section
    'features_title': 'When freedom matters most, you can trust Affordable Bail Bonds in Hidalgo County',
    'features_subtitle': 'We\'ve helped thousands of families navigate the bail process with confidence and discretion. Our experienced team provides personalized solutions tailored to your unique situation with the respect and urgency you deserve.',
    
    // Feature 1
    'feature1_title': 'We speak Spanish & English',
    'feature1_text': 'Our bilingual staff offers assistance in both Spanish and English to help you with any language barrier. We ensure clear communication throughout the entire process.',
    
    // Feature 2
    'feature2_title': '24/7 Service',
    'feature2_text': 'We are available 24 hours a day, 7 days a week, and approve all bail bonds ensuring quick release from jail, any time of day or night.',
    
    // Feature 3
    'feature3_title': 'Professional Experience',
    'feature3_text': 'We are a professional bail bond company that provides reliable and efficient services to people in need.',
    
    // Feature 4
    'feature4_title': 'Payment Plans',
    'feature4_text': 'We accept multiple payment methods: Cash, Cash App, Zelle, Venmo, Square (credit card), Money Orders, Cashier\'s Checks. Contact us for more payment options that fit your needs.',
    
    // Floating CTA
    'float_cta_title': 'Need immediate help?',
    'float_cta_text': 'We are available 24/7 to assist you',
    'float_cta_button': 'Call Now: +1 956-867-9269',
    
    // Services Section
    'services_title': 'Our Services',
    'services_subtitle': 'These are the services that Affordable Bail Bonds in Hidalgo County offers with a brief explanation of each term.',
    'services_cta': 'View all our services',
    
    // First three service cards
    'service_local_title': 'Local Bail Bonds',
    'service_local_text': 'Fast, reliable bail bonds service throughout Hidalgo County, Texas. We understand the local courts and can expedite the release process.',
    
    // Service Types
    'service_appearance_title': 'Appearance Bonds',
    'service_appearance_text': 'A type of bail bond that requires a defendant to appear in court at specific times and dates as ordered by the court.',
    
    'service_appeal_title': 'Appeal Bonds',
    'service_appeal_text': 'A type of bond that allows a defendant to be released from custody while appealing a conviction or sentence.',
    
    'service_more_title': 'More Bond Types',
    'service_more_text': 'We offer many more bond types. Call us at +1 956-867-9269 for information about our complete range of services.',
    
    // CTA Section
    'cta_title': 'Immediate freedom for your loved ones!',
    'cta_highlight1': 'Free quote with no obligation',
    'cta_highlight2': 'Professional bail bondsmen with years of experience',
    'cta_highlight3': 'Immediate help in difficult times',
    'cta_message': 'No one provides faster and more reliable service to help your loved ones in this critical moment.',
    'cta_button': 'CALL NOW: +1 956-867-9269',
    
    // Value Propositions
    'value_prop1_title': 'FREE CONSULTATION',
    'value_prop1_text': 'Get all the information you need about the bail process without any obligation.',
    'value_prop2_title': 'QUICK RELEASE',
    'value_prop2_text': 'We work efficiently to secure the fastest possible release for your loved ones.',
    'value_prop3_title': 'TRANSPARENCY & INTEGRITY',
    'value_prop3_text': 'Count on honest, straightforward guidance every step of the way.',
    
    // FAQ Section
    'faq_title': 'Frequently Asked Questions',
    'faq_q1': 'What factors determine your bail bond fees?',
    'faq_a1': 'The cost of our bail bond services varies on a case-by-case basis. We determine the fee based on four key factors: the defendant\'s citizenship status, their criminal history (such as DUI arrests or assaults), the type of charge they face, and the bail amount set by the courts.',
    
    'faq_inmate_q': 'How can I locate a Hidalgo County inmate?',
    'faq_inmate_a': 'The best way to find an inmate is to either call an Affordable Bail Bonds agent or you can visit https://pa.co.hidalgo.tx.us/default.aspx. Each bail bond has different circumstances. Our Agents are available 24 hours a day, 7 days a week. Please call to find out about your bail bond: 956-867-9269',
    
    'faq_q2': 'How quickly can you complete the bail process?',
    'faq_a2': 'Our bail process typically takes between 8-12 hours to complete. The exact timing depends on several factors, including how many other individuals are being processed for release at the same time.',
    'faq_q3': 'What role does an indemnitor play in the bail process?',
    'faq_a3': 'An indemnitor is the person who takes financial responsibility by signing the necessary paperwork for posting bail. By signing, they guarantee that the released person will appear at all court hearings. The indemnitor must also ensure the defendant follows all regulations and required check-ins throughout the legal process.',
    'faq_q4': 'What are the requirements to become an indemnitor?',
    'faq_a4': 'To qualify as an indemnitor (signature for a bail bond), you must: be a U.S. citizen, have a valid social security number, possess a current driver\'s license, be employed, and live in Hidalgo County.',
    'faq_q5': 'What payment options do you offer if I can\'t afford the full bond fee?',
    'faq_a5': 'We understand that bail bond fees can create financial strain. That\'s why we offer flexible payment plans tailored to your budget. Our team works with clients to create manageable payment schedules, allowing you to secure your loved one\'s release without having to pay the entire fee upfront.',
    'faq_q6': 'How long does it take to get someone released from jail?',
    'faq_a6': 'Release times vary depending on the detention facility and other circumstances. However, our agency prides itself on efficiency. Thanks to our proximity to Harris County Jail and our 24/7 availability, we can often secure a release within just a few hours after completing the bail bond paperwork.',
    'faq_q7': 'What happens if the defendant misses their court date?',
    'faq_a7': 'If a defendant fails to appear in court, serious consequences follow. The court will issue a bench warrant for their arrest, and our bail bond company becomes liable for the full bail amount. In such cases, we will actively work to locate the defendant and return them to custody to fulfill their legal obligations.',
    'faq_q8': 'How long will someone remain in jail if they can\'t pay bail?',
    'faq_a8': 'If a person cannot pay their bail, they will unfortunately remain incarcerated until their court date. The bail system requires payment for pre-trial release, and without it, detention continues regardless of a bondsman\'s abilities.',
    'faq_q9': 'After paying bail, how long before someone is released?',
    'faq_a9': 'Once bail is paid, release processing begins immediately. The time can range from minutes to several hours depending on three main factors: the number of people being processed simultaneously, the amount of paperwork required, and the number of jail staff available to handle releases.',
    'faq_q10': 'When can someone be released on bail?',
    'faq_a10': 'In most cases, releasing someone on bail takes between a few hours to several days, depending on various factors. For bail to be set, the accused must first appear before a judge. If this occurs on weekends or outside normal business hours, the accused may need to wait until the next morning or several days before bail can be established.',
    'faq_show_more': 'Show more questions',
    'faq_show_less': 'Show fewer questions',
    
    // Testimonials Section
    'testimonials_title': 'What our clients say',
    'testimonials_subtitle': 'Thousands of people have trusted us in their most difficult moments',
    
    // Testimonial 1
    'testimonial1_text': '"Affordable Bail Bonds in Hidalgo County responded immediately when my brother was arrested. They were professional and understanding throughout the process, explaining each step patiently. Thanks to them, my brother was released quickly."',
    'testimonial1_author': 'Carlos Rodríguez',
    'testimonial1_location': 'McAllen, TX',
    
    // Testimonial 2
    'testimonial2_text': '"I didn\'t know what to do when my son was arrested. I called Affordable Bail Bonds in Hidalgo County and they helped me immediately, even at 2 AM. Their Spanish service was excellent and they guided me through the entire process. Highly recommended."',
    'testimonial2_author': 'Alejandra Méndez',
    'testimonial2_location': 'Edinburg, TX',
    
    // Testimonial 3
    'testimonial3_text': '"Fast and efficient service. The flexible payment options helped me a lot during a difficult time. The bail agent was very professional and kept me informed throughout the process. I would recommend without hesitation."',
    'testimonial3_author': 'Miguel Ángel Torres',
    'testimonial3_location': 'Pharr, TX',
    
    'testimonials_cta': 'View more reviews on Google',
    
    // Location Section
    'location_title': 'Our Location',
    'location_subtitle': 'Find us easily for a personalized consultation about your case',
    'location_company': 'AFFORDABLE BAIL BONDS',
    'location_description': 'Bail Bond Service',
    'location_address_label': 'Address:',
    'location_address': '1506 Pecan Blvd, McAllen, TX 78501, United States',
    'location_phone_label': 'Phone:',
    'location_phone': '+1 956-867-9269',
    'location_phone_note': '(Available 24/7)',
    'location_hours_label': 'Office Hours:',
    'location_hours': 'Monday to Sunday, 24 hours',
    'location_nearby_label': 'Reference:',
    'location_nearby': 'Just minutes from Hidalgo County Jail (Cibolo Road)',
    'location_directions': 'Get Directions',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We\'re here to help with your bail bond needs',
    'contact.form.title': 'Send Us a Message',
    'contact.form.name': 'Full Name',
    'contact.form.email': 'Email Address',
    'contact.form.phone': 'Phone Number',
    'contact.form.message': 'Your Message',
    'contact.form.submit': 'Send Message',
    'contact.info.title': 'Contact Information',
    'contact.info.address': '123 Main Street, Santa Ana, CA 92705',
    'contact.info.phone': '(714) 555-1234',
    'contact.info.email': 'info@affordablebailbonds.com',
    'contact.info.hours': 'Open 24/7 - Available anytime you need us',
    
    // Contact Banner 
    'contact_title': 'Contact Affordable Bail Bonds in Hidalgo County',
    'contact_subtitle': 'Get immediate help for your bail bond needs',
    
    // Contact Form Fields
    'contact.form.arrestedPersonName': 'Arrested Person\'s Full Name',
    'contact.form.arrestedPersonDob': 'Arrested Person\'s Date of Birth',
    'contact.form.contactPersonName': 'Arrested Person\'s Name (optional)',
    'contact.form.contactPersonPhone': 'Your Phone Number',
    
    // Form Validation Messages
    'contact.form.error.required': 'This field is required',
    'contact.form.error.nameMinLength': 'Name must be at least 3 characters',
    'contact.form.error.phoneFormat': 'Please enter a valid phone number',
    'contact.form.error.messageMinLength': 'Message must be at least 10 characters',
    
    // Contact Form Placeholders
    'contact.form.name.placeholder': 'John Smith',
    'contact.form.arrestedPerson.placeholder': 'Michael Johnson',
    'contact.form.email.placeholder': 'your.email@example.com',
    'contact.form.phone.placeholder': '+XX (123) 456-7890',
    'contact.form.message.placeholder': 'Please provide details about your case...',
    
    // Form Submission Status
    'contact.form.submitting': 'Submitting...',
    'contact.form.success': 'Thank you! Your message has been sent successfully. We\'ll contact you shortly.',
    
    // Map and CTA Sections
    'contact_map_title': 'Find Us on the Map',
    'contact_cta_title': 'Need Immediate Assistance?',
    'contact_cta_text': 'Our bail bond agents are available 24/7 to help you get your loved one out of jail',
  },
  es: {
    // Header
    'language_toggle': 'English',
    'home': 'Inicio',
    'services': 'Servicios',
    'location': 'Ubicación',
    'testimonials': 'Testimonios',
    'faq': 'Preguntas Frecuentes',
    'contact': 'Contáctenos',
    'call_now': 'Llame ahora - 24/7',
    'payments': 'Pagos',
    'missed_court': 'Corte Perdida',
    'careers': 'Carreras',
    'blog': 'Blog',
    
    // Footer
    'footer.quick_links': 'Enlaces Rápidos',
    'footer.process': 'Liberación Rápida',
    'footer.social': 'Redes Sociales',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.license': 'Licencia',
    'footer.coming_soon': 'Proximamente',
    
    // Callback Request Tab
    'callback.tab_title': 'Te Devolvemos La Llamada',
    'callback.form_title': 'Solicitar una Llamada',
    'callback.form_subtitle': 'Complete este formulario y nos pondremos en contacto con usted',
    'callback.full_name': 'Fiador/Su Nombre Completo',
    'callback.dob': 'Fecha de nacimiento de la persona arrestada (opcional)',
    'callback.phone': 'Fiador/Su Número de Teléfono',
    'callback.message': 'Mensaje (opcional)',
    'callback.message_placeholder': 'Cuéntenos brevemente sobre su caso (máximo 200 caracteres)',
    'callback.fullName.placeholder': 'Juan Pérez',
    'callback.arrestedPerson.placeholder': 'Miguel González',
    'callback.phone.placeholder': '+XX (123) 456-7890',
    'callback.required': 'Campo obligatorio',
    'callback.submit': 'Solicitar Llamada',
    'callback.success': 'Gracias! Le llamaremos pronto.',
    'callback.error': 'Hubo un error al enviar su solicitud. Por favor, intente de nuevo.',
    
    // Hero Section
    'hero_title': 'Libertad inmediata con Affordable Bail Bonds en el Condado de Hidalgo',
    'hero_subtitle': 'Su fiador de confianza con más de 30 años de experiencia combinada en el sistema de proceso de fianzas. Cuando el tiempo es crucial, garantizamos el proceso de liberación más rápido posible.',
    'hero_call_button': 'Llame ahora: +1 956-867-9269',
    'hero_info_button': 'Solicitar información',
    
    // Promo Banner
    'promo_banner': 'Oferta especial: consulta gratuita y descuento en su primera fianza (Bail Bond). Llámenos hoy mismo.',
    
    // Service Areas Section
    'service_areas_title': 'Sirviendo a todo el Condado de Hidalgo',
    'service_areas_across_jail': 'A solo minutos de la Cárcel del Condado de Hidalgo (Cibolo Road)',
    'service_areas_licensed': 'Licencia en el Condado de Hidalgo #800107',
    'service_areas_cities': 'Alamo • Alton • Donna • Edcouch • Edinburg • Elsa • La Joya • La Villa • McAllen • Mercedes • Mission • Palmhurst • Penitas • Pharr • Progresso • San Juan • Sullivan • Weslaco, entre otras ciudades de Texas',
    
    // Features Section
    'features_title': 'Cuando la libertad es lo más importante, puede confiar en Affordable Bail Bonds en el Condado de Hidalgo',
    'features_subtitle': 'Hemos ayudado a miles de familias a navegar el proceso de fianza con confianza y discreción. Nuestro equipo experimentado proporciona soluciones personalizadas adaptadas a su situación única con el respeto y la urgencia que merece.',
    
    // Feature 1
    'feature1_title': 'Hablamos español e inglés',
    'feature1_text': 'Nuestro personal bilingüe ofrece asistencia tanto en español como en inglés para ayudarle con cualquier barrera del idioma. Garantizamos una comunicación clara durante todo el proceso.',
    
    // Feature 2
    'feature2_title': 'Servicio 24/7',
    'feature2_text': 'Estamos disponibles 24 horas al día, 7 días a la semana, y aprobamos todas las fianzas (Bail Bonds) garantizando una liberación rápida de la cárcel, a cualquier hora del día o noche.',
    
    // Feature 3
    'feature3_title': 'Experiencia profesional',
    'feature3_text': 'Somos una empresa de fianzas (Bail Bonds) profesional que proporciona servicios confiables y eficientes a personas en necesidad.',
    
    // Feature 4
    'feature4_title': 'Planes de pago',
    'feature4_text': 'Aceptamos múltiples métodos de pago: Efectivo, Cash App, Zelle, Venmo, Square (tarjeta de crédito), Giros Postales, Cheques de Caja. Contáctenos para más opciones de pago que se adapten a sus necesidades.',
    
    // Floating CTA
    'float_cta_title': '¿Necesita ayuda inmediata?',
    'float_cta_text': 'Estamos disponibles 24/7 para atenderle',
    'float_cta_button': 'Llame ahora: +1 956-867-9269',
    
    // Services Section
    'services_title': 'Nuestros Servicios',
    'services_subtitle': 'Estos son los servicios que Affordable Bail Bonds en el Condado de Hidalgo ofrece y aquí encontrará una breve explicación de cada término.',
    'services_cta': 'Ver todos nuestros servicios',
    
    // First three service cards
    'service_local_title': 'Fianzas Locales',
    'service_local_text': 'Servicio de fianzas rápido y confiable en todo el Condado de Hidalgo, Texas. Entendemos los tribunales locales y podemos acelerar el proceso de liberación.',
    
    // Service Types
    'service_appearance_title': 'Fianzas de comparecencia (Appearance Bonds)',
    'service_appearance_text': 'Un tipo de fianza que requiere que un acusado comparezca en la corte en horarios y fechas específicas según lo ordenado por la corte.',
    
    'service_appeal_title': 'Fianzas de apelación (Appeal Bonds)',
    'service_appeal_text': 'Un tipo de fianza que permite a un acusado ser liberado de la custodia mientras apela una condena o sentencia.',
    
    'service_more_title': 'Más Tipos de Fianzas',
    'service_more_text': 'Ofrecemos muchos más tipos de fianzas. Llámenos al +1 956-867-9269 para información sobre nuestra gama completa de servicios.',
    
    // CTA Section
    'cta_title': '¡Libertad inmediata para sus seres queridos!',
    'cta_highlight1': 'Cotización gratuita y sin compromiso',
    'cta_highlight2': 'Fiadores profesionales (Bail Bondsmen) con años de experiencia',
    'cta_highlight3': 'Ayuda inmediata en momentos difíciles',
    'cta_message': 'Nadie proporciona un servicio más rápido y confiable para ayudar a sus seres queridos en este momento crítico.',
    'cta_button': 'LLAME AHORA: +1 956-867-9269',
    
    // Value Propositions
    'value_prop1_title': 'CONSULTA GRATUITA',
    'value_prop1_text': 'Obtenga toda la información que necesita sobre el proceso de fianza sin ninguna obligación.',
    'value_prop2_title': 'LIBERACIÓN RÁPIDA',
    'value_prop2_text': 'Trabajamos eficientemente para asegurar la liberación más rápida posible para sus seres queridos.',
    'value_prop3_title': 'TRANSPARENCIA E INTEGRIDAD',
    'value_prop3_text': 'Cuente con una orientación honesta y directa en cada paso del proceso.',
    
    // FAQ Section
    'faq_title': 'Preguntas Frecuentes',
    'faq_q1': '¿Qué factores determinan las tarifas de sus fianzas?',
    'faq_a1': 'El costo de nuestros servicios de fianza varía caso por caso. Determinamos la tarifa basándonos en cuatro factores clave: la ciudadanía del acusado, su historial criminal (como arrestos por DUI o asaltos), el tipo de cargo que enfrenta, y el monto de la fianza establecido por los tribunales.',
    
    'faq_inmate_q': '¿Cómo puedo localizar a un recluso del Condado de Hidalgo?',
    'faq_inmate_a': 'La mejor manera de encontrar a un recluso es llamar a un agente de Affordable Bail Bonds o puede visitar https://pa.co.hidalgo.tx.us/default.aspx. Cada fianza tiene diferentes circunstancias. Nuestros agentes están disponibles 24 horas al día, 7 días a la semana. Por favor llame para informarse sobre su fianza: 956-867-9269',
    
    'faq_q2': '¿Cuánto tiempo tarda en completarse el proceso de fianza?',
    'faq_a2': 'Nuestro proceso de fianza generalmente toma entre 8 y 12 horas. El tiempo exacto depende de varios factores, incluyendo cuántas otras personas están siendo procesadas para su liberación al mismo tiempo.',
    'faq_q3': '¿Qué papel desempeña un indemnizador en el proceso de fianza?',
    'faq_a3': 'Un indemnizador es la persona que asume la responsabilidad financiera al firmar la documentación necesaria para la fianza. Al firmar, garantiza que la persona liberada comparecerá a todas las audiencias judiciales. El indemnizador también debe asegurarse de que el acusado cumpla con todas las regulaciones y registros requeridos durante el proceso legal.',
    'faq_q4': '¿Cuáles son los requisitos para convertirse en indemnizador?',
    'faq_a4': 'Para calificar como indemnizador (firma para una fianza), debe: ser ciudadano estadounidense, tener un número de seguro social válido, poseer una licencia de conducir vigente, estar empleado y vivir en el Condado de Hidalgo.',
    'faq_q5': '¿Qué opciones de pago ofrecen si no puedo pagar la tarifa completa de la fianza?',
    'faq_a5': 'Entendemos que las tarifas de fianza pueden crear tensión financiera. Por eso ofrecemos planes de pago flexibles adaptados a su presupuesto. Nuestro equipo trabaja con los clientes para crear calendarios de pago manejables, permitiéndole asegurar la liberación de su ser querido sin tener que pagar la tarifa completa por adelantado.',
    'faq_q6': '¿Cuánto tiempo toma liberar a alguien de la cárcel?',
    'faq_a6': 'Los tiempos de liberación varían según la instalación de detención y otras circunstancias. Sin embargo, nuestra agencia se enorgullece de su eficiencia. Gracias a nuestra proximidad a la Cárcel del Condado de Harris y nuestra disponibilidad 24/7, a menudo podemos asegurar una liberación en solo unas horas después de completar el papeleo de la fianza.',
    'faq_q7': '¿Qué sucede si el acusado no se presenta a su cita con la corte?',
    'faq_a7': 'Si un acusado no se presenta en la corte, siguen consecuencias graves. La corte emitirá una orden de arresto, y nuestra compañía de fianzas se hace responsable del monto total de la fianza. En tales casos, trabajaremos activamente para localizar al acusado y devolverlo a custodia para cumplir con sus obligaciones legales.',
    'faq_q8': '¿Cuánto tiempo permanecerá alguien en la cárcel si no puede pagar la fianza?',
    'faq_a8': 'Si una persona no puede pagar su fianza, desafortunadamente permanecerá encarcelada hasta la fecha de su juicio. El sistema de fianzas requiere pago para la liberación previa al juicio, y sin él, la detención continúa independientemente de las habilidades de un fiador.',
    'faq_q9': 'Después de pagar la fianza, ¿cuánto tiempo antes de que alguien sea liberado?',
    'faq_a9': 'Una vez que se paga la fianza, el procesamiento de liberación comienza inmediatamente. El tiempo puede variar desde minutos hasta varias horas dependiendo de tres factores principales: el número de personas siendo procesadas simultáneamente, la cantidad de papeleo requerido, y el número de personal carcelario disponible para manejar las liberaciones.',
    'faq_q10': '¿Cuándo puede ser liberada una persona bajo fianza?',
    'faq_a10': 'En la mayoría de los casos, liberar a alguien bajo fianza toma entre unas horas y varios días, dependiendo de varios factores. Para que se establezca la fianza, el acusado primero debe comparecer ante un juez. Si esto ocurre en fines de semana o fuera del horario comercial normal, el acusado puede necesitar esperar hasta la mañana siguiente o varios días antes de que se pueda establecer la fianza.',
    'faq_show_more': 'Mostrar más preguntas',
    'faq_show_less': 'Mostrar menos preguntas',
    
    // Testimonials Section
    'testimonials_title': 'Lo que dicen nuestros clientes',
    'testimonials_subtitle': 'Miles de personas han confiado en nosotros en sus momentos más difíciles',
    
    // Testimonial 1
    'testimonial1_text': '"Affordable Bail Bonds en el Condado de Hidalgo respondió inmediatamente cuando mi hermano fue arrestado. Fueron profesionales y comprensivos durante todo el proceso, explicando cada paso con paciencia. Gracias a ellos, mi hermano fue liberado rápidamente."',
    'testimonial1_author': 'Carlos Rodríguez',
    'testimonial1_location': 'McAllen, TX',
    
    // Testimonial 2
    'testimonial2_text': '"No sabía qué hacer cuando mi hijo fue detenido. Llamé a Affordable Bail Bonds en el Condado de Hidalgo y me atendieron de inmediato, incluso a las 2 de la madrugada. Su servicio en español fue excelente y me guiaron a través de todo el proceso. Muy recomendable."',
    'testimonial2_author': 'Alejandra Méndez',
    'testimonial2_location': 'Edinburg, TX',
    
    // Testimonial 3
    'testimonial3_text': '"Servicio rápido y eficiente. Las opciones de pago flexibles me ayudaron mucho en un momento difícil. El agente de fianzas (Bail Agent) fue muy profesional y me mantuvo informado durante todo el proceso. Lo recomendaría sin dudarlo."',
    'testimonial3_author': 'Miguel Ángel Torres',
    'testimonial3_location': 'Pharr, TX',
    
    'testimonials_cta': 'Ver más reseñas en Google',
    
    // Location Section
    'location_title': 'Nuestra Ubicación',
    'location_subtitle': 'Encuéntrenos fácilmente para una consulta personalizada sobre su caso',
    'location_company': 'AFFORDABLE BAIL BONDS',
    'location_description': 'Servicio de fianzas (Bail Bonds)',
    'location_address_label': 'Dirección:',
    'location_address': '1506 Pecan Blvd, McAllen, TX 78501, Estados Unidos',
    'location_phone_label': 'Teléfono:',
    'location_phone': '+1 956-867-9269',
    'location_phone_note': '(Disponible 24/7)',
    'location_hours_label': 'Horario de oficina:',
    'location_hours': 'Lunes a Domingo, 24 horas',
    'location_nearby_label': 'Referencia:',
    'location_nearby': 'A solo minutos de la Cárcel del Condado de Hidalgo (Cibolo Road)',
    'location_directions': 'Obtener Direcciones',
    
    // Contact
    'contact.title': 'Contáctenos',
    'contact.subtitle': 'Estamos aquí para ayudar con sus necesidades de fianza',
    'contact.form.title': 'Envíenos un Mensaje',
    'contact.form.name': 'Nombre Completo',
    'contact.form.email': 'Correo Electrónico',
    'contact.form.phone': 'Número de Teléfono',
    'contact.form.message': 'Su Mensaje',
    'contact.form.submit': 'Enviar Mensaje',
    'contact.info.title': 'Información de Contacto',
    'contact.info.address': '123 Main Street, Santa Ana, CA 92705',
    'contact.info.phone': '(714) 555-1234',
    'contact.info.email': 'info@affordablebailbonds.com',
    'contact.info.hours': 'Abierto 24/7 - Disponible cuando nos necesite',
    
    // Contact Banner 
    'contact_title': 'Contacte a Affordable Bail Bonds en el Condado de Hidalgo',
    'contact_subtitle': 'Obtenga ayuda inmediata para sus necesidades de fianza',
    
    // Contact Form Fields
    'contact.form.arrestedPersonName': 'Nombre completo de la persona detenida',
    'contact.form.arrestedPersonDob': 'Fecha de nacimiento de la persona detenida',
    'contact.form.contactPersonName': 'Nombre de la persona arrestada (opcional)',
    'contact.form.contactPersonPhone': 'Su número de teléfono',
    
    // Form Validation Messages
    'contact.form.error.required': 'Este campo es obligatorio',
    'contact.form.error.nameMinLength': 'El nombre debe tener al menos 3 caracteres',
    'contact.form.error.phoneFormat': 'Por favor ingrese un número de teléfono válido',
    'contact.form.error.messageMinLength': 'El mensaje debe tener al menos 10 caracteres',
    
    // Contact Form Placeholders
    'contact.form.name.placeholder': 'Juan Pérez',
    'contact.form.arrestedPerson.placeholder': 'Miguel González',
    'contact.form.email.placeholder': 'su.email@ejemplo.com',
    'contact.form.phone.placeholder': '+XX (123) 456-7890',
    'contact.form.message.placeholder': 'Por favor proporcione detalles sobre su caso...',
    
    // Form Submission Status
    'contact.form.submitting': 'Enviando...',
    'contact.form.success': 'Gracias! Su mensaje ha sido enviado con éxito. Nos pondremos en contacto con usted en breve.',
    
    // Map and CTA Sections
    'contact_map_title': 'Encuéntrenos en el Mapa',
    'contact_cta_title': '¿Necesita Asistencia Inmediata?',
    'contact_cta_text': 'Nuestros agentes de fianzas están disponibles 24/7 para ayudarle a liberar a su ser querido',
  }
}; 