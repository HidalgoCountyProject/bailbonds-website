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
    'hero_title': 'Immediate Freedom with Hidalgo Bail Bonds',
    'hero_subtitle': 'Professional bail bond service available 24/7 to ensure quick release from jail',
    'hero_call_button': 'Call Now: (800) 123-4567',
    'hero_info_button': 'Request Information',
    
    // Promo Banner
    'promo_banner': 'Special offer: Free consultation and discount on your first bail bond. Call us today.',
    
    // Features Section
    'features_title': 'When freedom matters most, you can trust Hidalgo Bail Bonds',
    'features_subtitle': 'Getting a bail bond for your loved ones can be complicated. Understanding the charges and processing time provides peace of mind. We are here to help with your needs.',
    
    // Feature 1
    'feature1_title': 'We speak Spanish',
    'feature1_text': 'We offer Spanish translation services to help you with any language barrier. Our staff is friendly and Spanish-speaking.',
    
    // Feature 2
    'feature2_title': '24/7 Service',
    'feature2_text': 'We are available 24 hours a day, 7 days a week, and approve all bail bonds ensuring quick release from jail, any time of day or night.',
    
    // Feature 3
    'feature3_title': 'Professional Experience',
    'feature3_text': 'We are a professional bail bond company that provides reliable and efficient services to people in need.',
    
    // Feature 4
    'feature4_title': 'Payment Plans',
    'feature4_text': 'More payment options for bail bonds, we offer payment options that fit your needs.',
    
    // Floating CTA
    'float_cta_title': 'Need immediate help?',
    'float_cta_text': 'We are available 24/7 to assist you',
    'float_cta_button': 'Call Now: (800) 123-4567',
    
    // Services Section
    'services_title': 'Our Services',
    'services_subtitle': 'These are the services that Hidalgo Bail Bonds offers with a brief explanation of each term.',
    'services_cta': 'View all our services',
    
    // Service Types
    'service_appearance_title': 'Appearance Bonds',
    'service_appearance_text': 'A type of bail bond that requires a defendant to appear in court at specific times and dates as ordered by the court.',
    
    'service_federal_title': 'Federal Bonds',
    'service_federal_text': 'Specific bonds for federal crimes, which are typically more complex and require specialized expertise in the federal judicial system.',
    
    'service_immigration_title': 'Immigration Bonds',
    'service_immigration_text': 'Specialized bonds for immigration and deportation cases, helping individuals detained by ICE.',
    
    'service_appeal_title': 'Appeal Bonds',
    'service_appeal_text': 'A type of bond that allows a defendant to be released from custody while appealing a conviction or sentence.',
    
    'service_license_title': 'License Bonds',
    'service_license_text': 'Ensure compliance with state and local regulations with our license bonds for contractors and other professionals.',
    
    'service_utility_title': 'Utility Bonds',
    'service_utility_text': 'Guarantees required by utility companies to ensure payment of future bills.',
    
    'service_notary_title': 'Notary Bonds',
    'service_notary_text': 'We offer bonds for notaries public in Hidalgo, guaranteeing protection against errors or omissions.',
    
    'service_probate_title': 'Probate Bonds',
    'service_probate_text': 'We ensure proper management of an estate during the probate process (executor bonds).',
    
    'service_more_title': 'More Bond Types',
    'service_more_text': 'We offer many more bond types. Call us at (800) 123-4567 for information about our complete range of services.',
    
    // CTA Section
    'cta_title': 'Immediate freedom for your loved ones!',
    'cta_highlight1': 'Free quote with no obligation',
    'cta_highlight2': 'Professional bail bondsmen with years of experience',
    'cta_highlight3': 'Immediate help in difficult times',
    'cta_message': 'No one provides faster and more reliable service to help your loved ones in this critical moment.',
    'cta_button': 'CALL NOW: (800) 123-4567',
    
    // FAQ Section
    'faq_title': 'Frequently Asked Questions',
    'faq_q1': 'What do I need to get someone out of jail?',
    'faq_a1': 'Answer content will go here.',
    'faq_q2': 'What determines the cost of bail?',
    'faq_a2': 'Answer content will go here.',
    'faq_q3': 'What payment methods do you accept?',
    'faq_a3': 'Answer content will go here.',
    'faq_q4': 'How long does the process take?',
    'faq_a4': 'Answer content will go here.',
    
    // Testimonials Section
    'testimonials_title': 'What our clients say',
    'testimonials_subtitle': 'Thousands of people have trusted us in their most difficult moments',
    
    // Testimonial 1
    'testimonial1_text': '"Hidalgo Bail Bonds responded immediately when my brother was arrested. They were professional and understanding throughout the process, explaining each step patiently. Thanks to them, my brother was released quickly."',
    'testimonial1_author': 'Carlos Rodríguez',
    'testimonial1_location': 'McAllen, TX',
    
    // Testimonial 2
    'testimonial2_text': '"I didn\'t know what to do when my son was arrested. I called Hidalgo Bail Bonds and they helped me immediately, even at 2 AM. Their Spanish service was excellent and they guided me through the entire process. Highly recommended."',
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
    'location_phone': '(800) 123-4567',
    'location_phone_note': '(Available 24/7)',
    'location_hours_label': 'Office Hours:',
    'location_hours': 'Monday to Sunday, 24 hours',
    'location_nearby_label': 'Near:',
    'location_nearby': 'Hidalgo County Courthouse, Detention Center',
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
    'contact.info.email': 'info@hidalgobailbonds.com',
    'contact.info.hours': 'Open 24/7 - Available anytime you need us',
    
    // Contact Banner 
    'contact_title': 'Contact Hidalgo Bail Bonds',
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
    'hero_title': 'Libertad inmediata con Hidalgo Bail Bonds',
    'hero_subtitle': 'Servicio profesional de fianzas (Bail Bonds) disponible 24/7 para garantizar una liberación rápida de la cárcel',
    'hero_call_button': 'Llame ahora: (800) 123-4567',
    'hero_info_button': 'Solicitar información',
    
    // Promo Banner
    'promo_banner': 'Oferta especial: consulta gratuita y descuento en su primera fianza (Bail Bond). Llámenos hoy mismo.',
    
    // Features Section
    'features_title': 'Cuando la libertad es lo más importante, puede confiar en Hidalgo Bail Bonds',
    'features_subtitle': 'Obtener una fianza (Bail Bond) para sus seres queridos puede ser complicado. Conocer los cargos y el tiempo de entrega brinda seguridad. Estamos aquí para ayudarle con sus necesidades.',
    
    // Feature 1
    'feature1_title': 'Hablamos español',
    'feature1_text': 'Ofrecemos servicios de traducción al español para ayudarle con cualquier barrera del idioma. Nuestro personal es amable y habla español.',
    
    // Feature 2
    'feature2_title': 'Servicio 24/7',
    'feature2_text': 'Estamos disponibles 24 horas al día, 7 días a la semana, y aprobamos todas las fianzas (Bail Bonds) garantizando una liberación rápida de la cárcel, a cualquier hora del día o noche.',
    
    // Feature 3
    'feature3_title': 'Experiencia profesional',
    'feature3_text': 'Somos una empresa de fianzas (Bail Bonds) profesional que proporciona servicios confiables y eficientes a personas en necesidad.',
    
    // Feature 4
    'feature4_title': 'Planes de pago',
    'feature4_text': 'Más opciones de pago para fianzas (Bail Bonds), ofrecemos opciones de pago que se adaptan a sus necesidades.',
    
    // Floating CTA
    'float_cta_title': '¿Necesita ayuda inmediata?',
    'float_cta_text': 'Estamos disponibles 24/7 para atenderle',
    'float_cta_button': 'Llame ahora: (800) 123-4567',
    
    // Services Section
    'services_title': 'Nuestros Servicios',
    'services_subtitle': 'Estos son los servicios que Hidalgo Bail Bonds ofrece y aquí encontrará una breve explicación de cada término.',
    'services_cta': 'Ver todos nuestros servicios',
    
    // Service Types
    'service_appearance_title': 'Fianzas de comparecencia (Appearance Bonds)',
    'service_appearance_text': 'Un tipo de fianza que requiere que un acusado comparezca en la corte en horarios y fechas específicas según lo ordenado por la corte.',
    
    'service_federal_title': 'Fianzas federales (Federal Bonds)',
    'service_federal_text': 'Fianzas específicas para delitos federales, que suelen ser más complejas y requieren una experiencia especializada en el sistema judicial federal.',
    
    'service_immigration_title': 'Fianzas de inmigración (Immigration Bonds)',
    'service_immigration_text': 'Fianzas especializadas para casos relacionados con la inmigración y deportación, ayudando a las personas detenidas por ICE.',
    
    'service_appeal_title': 'Fianzas de apelación (Appeal Bonds)',
    'service_appeal_text': 'Un tipo de fianza que permite a un acusado ser liberado de la custodia mientras apela una condena o sentencia.',
    
    'service_license_title': 'Fianzas para Licencias (License Bonds)',
    'service_license_text': 'Asegure el cumplimiento de las regulaciones estatales y locales con nuestras fianzas para licencias de contratistas y otros profesionales.',
    
    'service_utility_title': 'Fianzas de Utilidad (Utility Bonds)',
    'service_utility_text': 'Garantías requeridas por compañías de servicios públicos para asegurar el pago de futuras facturas.',
    
    'service_notary_title': 'Fianzas de Notario (Notary Bonds)',
    'service_notary_text': 'Ofrecemos fianzas para notarios públicos en Hidalgo, garantizando la protección contra errores u omisiones.',
    
    'service_probate_title': 'Fianzas Testamentarias (Probate Bonds)',
    'service_probate_text': 'Aseguramos la gestión adecuada de un patrimonio durante el proceso testamentario (fianzas de albacea).',
    
    'service_more_title': 'Más Tipos de Fianzas',
    'service_more_text': 'Ofrecemos muchos más tipos de fianzas. Llámenos al (800) 123-4567 para información sobre nuestra gama completa de servicios.',
    
    // CTA Section
    'cta_title': '¡Libertad inmediata para sus seres queridos!',
    'cta_highlight1': 'Cotización gratuita y sin compromiso',
    'cta_highlight2': 'Fiadores profesionales (Bail Bondsmen) con años de experiencia',
    'cta_highlight3': 'Ayuda inmediata en momentos difíciles',
    'cta_message': 'Nadie proporciona un servicio más rápido y confiable para ayudar a sus seres queridos en este momento crítico.',
    'cta_button': 'LLAME AHORA: (800) 123-4567',
    
    // FAQ Section
    'faq_title': 'Preguntas Frecuentes',
    'faq_q1': '¿Qué necesito para sacar a alguien de la cárcel?',
    'faq_a1': 'Contenido de la respuesta irá aquí.',
    'faq_q2': '¿Qué determina el costo de la fianza (Bail Bond)?',
    'faq_a2': 'Contenido de la respuesta irá aquí.',
    'faq_q3': '¿Qué formas de pago aceptan?',
    'faq_a3': 'Contenido de la respuesta irá aquí.',
    'faq_q4': '¿Cuánto tiempo toma el proceso?',
    'faq_a4': 'Contenido de la respuesta irá aquí.',
    
    // Testimonials Section
    'testimonials_title': 'Lo que dicen nuestros clientes',
    'testimonials_subtitle': 'Miles de personas han confiado en nosotros en sus momentos más difíciles',
    
    // Testimonial 1
    'testimonial1_text': '"Hidalgo Bail Bonds respondió inmediatamente cuando mi hermano fue arrestado. Fueron profesionales y comprensivos durante todo el proceso, explicando cada paso con paciencia. Gracias a ellos, mi hermano fue liberado rápidamente."',
    'testimonial1_author': 'Carlos Rodríguez',
    'testimonial1_location': 'McAllen, TX',
    
    // Testimonial 2
    'testimonial2_text': '"No sabía qué hacer cuando mi hijo fue detenido. Llamé a Hidalgo Bail Bonds y me atendieron de inmediato, incluso a las 2 de la madrugada. Su servicio en español fue excelente y me guiaron a través de todo el proceso. Muy recomendable."',
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
    'location_phone': '(800) 123-4567',
    'location_phone_note': '(Disponible 24/7)',
    'location_hours_label': 'Horario de oficina:',
    'location_hours': 'Lunes a Domingo, 24 horas',
    'location_nearby_label': 'Cerca de:',
    'location_nearby': 'Juzgado del Condado de Hidalgo, Centro de Detención',
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
    'contact.info.email': 'info@hidalgobailbonds.com',
    'contact.info.hours': 'Abierto 24/7 - Disponible cuando nos necesite',
    
    // Contact Banner 
    'contact_title': 'Contacte a Hidalgo Bail Bonds',
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