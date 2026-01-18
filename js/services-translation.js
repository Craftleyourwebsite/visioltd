(function () {
    const translations = {
        'EN': {
            // Intro
            'intro_subtitle': 'Vision. Design. Inspire',
            'intro_quote': '"Future-Ready by Design"',
            'intro_title': 'SERVICES',
            'intro_desc': 'From concept to completion, we bring innovation and rigor to every detail—designing timeless spaces that elevate everyday life.',
            'intro_btn': 'All Services',
            'intro_visio_title': 'VISIO Architecture: Timeless spaces shaped by innovation, rigorous planning, and client-focused delivery.',
            'intro_visio_desc': 'VISIO Architecture brings together creativity and precision. With expertise in design, planning, and project management, we transform your ambition into exceptional built outcomes.',

            // Accordion - Architecture
            'acc_arch_title': 'Architecture',
            'acc_arch_list': '<li>Architectural design</li><li>Site analysis & architectural programming</li><li>Concept design options + massing studies</li><li>Schematic design</li><li>Design development</li><li>Technical design / detailed design</li><li>Statutory submissions & permit drawings</li><li>Construction documentation</li><li>Tender drawings + specifications + Bills support</li><li>Value engineering support</li><li>Construction stage services</li><li>Snagging / de-snagging, handover support, close-out documentation</li>',

            // Accordion - Urban Planning
            'acc_urban_title': 'Urban Planning & Master Planning',
            'acc_urban_list': '<li>Urban design and master planning</li><li>Feasibility and development potential studies</li><li>Land use planning + density / typology studies</li><li>Transit-oriented planning</li><li>Urban regeneration strategies</li><li>Regulatory planning guidance</li><li>Public realm, streetscape, and placemaking frameworks</li><li>Phasing and implementation planning</li>',

            // Accordion - Interior
            'acc_interior_title': 'Interior Architecture & Fit-Out',
            'acc_interior_list': '<li>Interior design concept and space planning</li><li>FF&E design guidance</li><li>Materials, finishes, lighting concept, and detailing</li><li>Joinery / millwork design and specifications</li><li>Fit-out technical drawings and tender packages</li><li>Site follow-up and quality control for fit-out works</li>',

            // Accordion - Landscape
            'acc_landscape_title': 'Landscape Architecture & External Works',
            'acc_landscape_list': '<li>Landscape concept and detailed design</li><li>Hardscape/softscape design</li><li>External lighting concept</li><li>Boundary treatments, entrance statements, wayfinding principles</li><li>Climate-responsive landscape strategies</li><li>Stormwater-sensitive landscape integration</li>',

            // Accordion - Project Management
            'acc_pm_title': 'Project Management',
            'acc_pm_list': '<li>Project appraisal and project structuring support</li><li>Design programme and deliverables planning</li><li>Stakeholder coordination and meeting leadership</li><li>Consultant coordination</li><li>Design risk management</li><li>Procurement and tender process support</li><li>Construction phase coordination support</li>',

            // Accordion - Feasibility
            'acc_feasibility_title': 'Feasibility, Strategy & Development Advisory Planning',
            'acc_feasibility_list': '<li>Highest-and-best-use studies</li><li>Development strategy and positioning</li><li>Concept visioning packs for investors / boards</li><li>Preliminary cost alignment and scope optimization</li><li>Development control and constructability reviews</li>',

            // Accordion - Refurbishment
            'acc_refurb_title': 'Building Refurbishment, Retrofit & Adaptive Reuse',
            'acc_refurb_list': '<li>Condition appraisal and upgrade strategies</li><li>Façade refurbishment / modernization concepts</li><li>Replanning, reconfiguration, and conversion studies</li><li>Heritage-sensitive upgrades and adaptive reuse frameworks</li><li>Phased refurbishment planning</li>',

            // Accordion - Sustainability
            'acc_sustain_title': 'Sustainability & Resilience Integration',
            'acc_sustain_sub_title': 'Design Excellence',
            'acc_sustain_list': '<li>Climate-responsive design</li><li>Passive design studies</li><li>Material strategy for durability and reduced maintenance</li><li>Rainwater harvesting and basic resource-efficiency integration</li><li>Resilience-driven detailing principles</li>',
            'acc_sustain_bim_title': 'BIM / Digital Design Support',
            'acc_sustain_bim_list': '<li>BIM-ready design delivery</li><li>3D modeling and coordination support</li><li>Drawing standards, documentation management, revision control support</li>',
            'acc_sustain_spec_title': 'Specialist Built-Environment Studies',
            'acc_sustain_spec_list': '<li>Functional flow planning</li><li>Space standards, area schedules, stacking and adjacency studies</li><li>Accessibility and user-experience planning</li><li>Wayfinding principles and signage coordination</li>',

            // Type of Projects
            'type_title': 'TYPE OF PROJECTS',

            // Type of Projects - Columns
            'type_core_title': 'Core Architecture',
            'type_core_desc': 'Commercial & Mixed-Use<br>Office Buildings & Corporate HQ<br>Retail & Flagship Stores<br>Hospitality & Tourism Resorts<br>Residential Villas<br>Residential Apartments<br>Penthouses<br>Townhouses<br>Gated Communities<br>Public Buildings & Civic Architecture<br>Cultural & Museum Projects<br>Education & Training Facilities<br>Healthcare Facilities<br>Sports & Leisure Facilities<br>Affordable / Mass Housing Planning',

            'type_infra_title': 'Infrastructure & Transport',
            'type_infra_desc': 'Airport & Aviation Facilities<br>Urban Terminals & Mobility Hubs<br>Transport-Oriented Development<br>Stations & Interchanges<br>Port / Waterfront Developments',

            'type_ind_title': 'Industrial & Logistics',
            'type_ind_desc': 'Industrial Facilities & Warehousing<br>Logistics Parks & Distribution Hubs<br>Waste & Environmental Infrastructure<br>Utilities & Technical Buildings',

            'type_urban_dev_title': 'Urban Planning & Territorial Development',
            'type_urban_dev_desc': 'City Regeneration & Urban Renewal<br>Master Planning & New Towns<br>Smart City / Mixed-Use Districts<br>Brownfield Regeneration & Post-Industrial Sites<br>Public Realm & Placemaking',

            'type_heritage_title': 'Heritage & Adaptive Reuse',
            'type_heritage_desc': 'Heritage Conservation<br>Adaptive Reuse & Conversions<br>Façade Upgrades & Building Refurbishments<br>UNESCO Context / Heritage Impact Projects',

            'type_interior_title': 'Interior Architecture',
            'type_interior_desc': 'Corporate Interiors<br>Retail Interiors<br>Residential Interiors<br>Hospitality Interiors<br>Workspace Fit-Out & Refurbishment',

            'type_land_title': 'Landscape & Environment',
            'type_land_desc': 'Landscape Architecture<br>Parks, Green Corridors & Waterfront Landscapes<br>Sustainable / Climate-Resilient Design Projects',

            'type_spec_title': 'Specialist / Strategic Work',
            'type_spec_desc': 'Feasibility Studies & Development Strategy<br>Concept Visioning & Investment Pitch Packages<br>Design Competitions & Prototypes',

            // Collaboration
            'collab_subtitle': 'Collaboration —',
            'collab_title': 'Let\'s work together.',
            'collab_text': 'Tell us about your project— we’ll help shape it from idea to delivery',
            'collab_btn': 'Contact Us',

            // Mission & Vision
            'footer_mission_vision_title': 'MISSION & VISION',
            'footer_mission_subtitle': 'MISSION',
            'footer_mission_desc': 'To deliver design excellence through innovation, technical rigour, and sustainable thinking—creating spaces and places that add long-term value for clients and communities.',
            'footer_vision_subtitle': 'VISION',
            'footer_vision_desc': 'To set the benchmark for architecture, planning, and development in Mauritius, and to be recognised among Africa\'s leading multidisciplinary firms.',

            // Footer Common
            'footer_links_title': 'LINKS',
            'footer_home': 'Home',
            'footer_about': 'About Us',
            'footer_services': 'Services',
            'footer_africa': 'Africa',
            'footer_rise': 'RISE',
            'footer_social': 'Social',
            'footer_projects': 'Projects',
            'footer_news': 'News',
            'footer_contact': 'Contact',
            'footer_contact_us_title': 'CONTACT US',
            'footer_address_title': 'Address',
            'footer_address_content': '45, Saint Georges Street 11324 Port Louis, Mauritius',
            'footer_mail_title': 'Mail Us',
            'footer_call_title': 'Call Us',
            'footer_hours_title': 'Working Hours',
            'footer_hours_content': 'Monday - Friday : 8:00am - 5:00 pm',
            'footer_our_projects_title': 'OUR PROJECTS',
            'footer_all_projects': 'All Projects'
        },
        'FR': {
            // Intro
            'intro_subtitle': 'Vision. Design. Inspirer.',
            'intro_quote': '"Conçu pour l’Avenir"',
            'intro_title': 'SERVICES',
            'intro_desc': 'Du concept à la réalisation, nous apportons innovation et rigueur à chaque détail — concevant des espaces intemporels qui élèvent le quotidien.',
            'intro_btn': 'Tous nos Services',
            'intro_visio_title': 'VISIO Architecture : Des espaces intemporels façonnés par l’innovation, une planification rigoureuse et une livraison centrée sur le client.',
            'intro_visio_desc': 'VISIO Architecture allie créativité et précision. Forts d’une expertise en conception, urbanisme et gestion de projet, nous transformons votre ambition en réalisations exceptionnelles.',

            // Accordion - Architecture
            'acc_arch_title': 'Architecture',
            'acc_arch_list': '<li>Conception architecturale</li><li>Analyse de site & programmation architecturale</li><li>Options de conception & études de volumétrie</li><li>Conception schématique</li><li>Développement du design</li><li>Conception technique / détaillée</li><li>Soumissions réglementaires & dessins de permis</li><li>Dossier de construction</li><li>Dessins d’appel d’offres + spécifications + support aux métrés</li><li>Support en ingénierie de la valeur</li><li>Services en phase de construction</li><li>Suivi des réserves, support à la livraison, dossier de clôture</li>',

            // Accordion - Urban Planning
            'acc_urban_title': 'Urbanisme & Master Planning',
            'acc_urban_list': '<li>Design urbain et master planning</li><li>Études de faisabilité et potentiel de développement</li><li>Planification de l’utilisation des sols + études de densité / typologie</li><li>Planification orientée vers le transport (TOD)</li><li>Stratégies de régénération urbaine</li><li>Conseils en réglementation d’urbanisme</li><li>Espace public, paysage urbain et cadres de "placemaking"</li><li>Planification du phasage et de la mise en œuvre</li>',

            // Accordion - Interior
            'acc_interior_title': 'Architecture d’Intérieur & Aménagement',
            'acc_interior_list': '<li>Concept de design d’intérieur et aménagement spatial (Space Planning)</li><li>Conseil en FF&E (Mobilier, Fixtures & Équipements)</li><li>Matériaux, finitions, concept d’éclairage et détails</li><li>Design et spécifications de menuiserie</li><li>Dessins techniques d’aménagement et dossiers d’appel d’offres</li><li>Suivi de chantier et contrôle qualité pour les travaux d’aménagement</li>',

            // Accordion - Landscape
            'acc_landscape_title': 'Architecture Paysagère & Aménagements Extérieurs',
            'acc_landscape_list': '<li>Concept paysager et design détaillé</li><li>Aménagements minéraux et végétaux (Hardscape/Softscape)</li><li>Concept d’éclairage extérieur</li><li>Traitement des limites, entrées, principes de signalétique</li><li>Stratégies paysagères sensibles au climat</li><li>Intégration de la gestion des eaux pluviales dans le paysage</li>',

            // Accordion - Project Management
            'acc_pm_title': 'Gestion de Projet',
            'acc_pm_list': '<li>Évaluation de projet et support à la structuration</li><li>Programmation du design et planification des livrables</li><li>Coordination des parties prenantes et conduite de réunions</li><li>Coordination des consultants</li><li>Gestion des risques de conception</li><li>Support aux processus d’achat et d’appel d’offres</li><li>Support à la coordination en phase de construction</li>',

            // Accordion - Feasibility
            'acc_feasibility_title': 'Faisabilité, Stratégie & Conseil en Développement',
            'acc_feasibility_list': '<li>Études de « Highest-and-best-use »</li><li>Stratégie de développement et positionnement</li><li>Dossiers de vision conceptuelle pour investisseurs / conseils</li><li>Alignement budgétaire préliminaire et optimisation du périmètre</li><li>Contrôle du développement et revues de constructibilité</li>',

            // Accordion - Refurbishment
            'acc_refurb_title': 'Rénovation, Réhabilitation & Réutilisation Adaptative',
            'acc_refurb_list': '<li>Évaluation de l’état et stratégies de mise à niveau</li><li>Concepts de rénovation / modernisation de façade</li><li>Études de replanification, reconfiguration et conversion</li><li>Mises à niveau respectueuses du patrimoine et cadres de réutilisation adaptative</li><li>Planification de rénovation par phases</li>',

            // Accordion - Sustainability
            'acc_sustain_title': 'Intégration Durabilité & Résilience',
            'acc_sustain_sub_title': 'Excellence du Design',
            'acc_sustain_list': '<li>Conception sensible au climat</li><li>Études de conception passive</li><li>Stratégie matérielle pour la durabilité et la maintenance réduite</li><li>Récupération des eaux de pluie et intégration de l’efficacité des ressources</li><li>Principes de détails axés sur la résilience</li>',
            'acc_sustain_bim_title': 'Support BIM / Conception Numérique',
            'acc_sustain_bim_list': '<li>Livraison de design compatible BIM</li><li>Modélisation 3D et support à la coordination</li><li>Normes de dessin, gestion documentaire, support au contrôle des révisions</li>',
            'acc_sustain_spec_title': 'Études Spécialisées de l’Environnement Bâti',
            'acc_sustain_spec_list': '<li>Planification des flux fonctionnels</li><li>Normes spatiales, tableaux de surfaces, études d’empilement et d’adjacence</li><li>Planification de l’accessibilité et de l’expérience utilisateur</li><li>Principes d’orientation et coordination de la signalétique</li>',

            // Type of Projects
            'type_title': 'TYPES DE PROJETS',

            // Type of Projects - Columns
            'type_core_title': 'Architecture Principale',
            'type_core_desc': 'Commercial & Usage Mixte<br>Immeubles de Bureaux & Sièges Sociaux<br>Commerce de Détail & Magasins Phares<br>Hôtellerie & Complex touristiques<br>Villas Résidentielles<br>Appartements Résidentiels<br>Penthouses<br>Townhouses<br>Communautés Fermées<br>Bâtiments Publics & Architecture Civique<br>Projets Culturels & Musées<br>Installations d’Éducation & Formation<br>Installations de Santé<br>Installations Sportives & de Loisirs<br>Logements Sociaux / Planification de Masse',

            'type_infra_title': 'Infrastructure & Transport',
            'type_infra_desc': 'Installations Aéroportuaires & Aviation<br>Gares Urbaines & Pôles de Mobilité<br>Développement Orienté Transport (TOD)<br>Gares & Échangeurs<br>Développements Portuaires / Fronts de Mer',

            'type_ind_title': 'Industriel & Logistique',
            'type_ind_desc': 'Installations Industrielles & Entrepôts<br>Parcs Logistiques & Hubs de Distribution<br>Infrastructures de Déchets & Environnement<br>Utilités & Bâtiments Techniques',

            'type_urban_dev_title': 'Urbanisme & Développement Territorial',
            'type_urban_dev_desc': 'Régénération Urbaine & Renouveau<br>Master Planning & Villes Nouvelles<br>Smart City / Quartiers à Usage Mixte<br>Régénération de Friches & Sites Post-Industriels<br>Espace Public & Placemaking',

            'type_heritage_title': 'Patrimoine & Réutilisation Adaptative',
            'type_heritage_desc': 'Conservation du Patrimoine<br>Réutilisation Adaptative & Conversions<br>Mises à Niveau de Façade & Rénovations de Bâtiments<br>Contextes UNESCO / Projets d’Impact Patrimonial',

            'type_interior_title': 'Architecture d’Intérieur',
            'type_interior_desc': 'Intérieurs d’Entreprise<br>Intérieurs Commerciaux<br>Intérieurs Résidentiels<br>Intérieurs Hôteliers<br>Aménagement & Rénovation d’Espaces de Travail',

            'type_land_title': 'Paysage & Environnement',
            'type_land_desc': 'Architecture Paysagère<br>Parcs, Corridors Verts & Paysages de Front de Mer<br>Projets de Design Durable / Résilient au Climat',

            'type_spec_title': 'Travaux Spécialisés / Stratégiques',
            'type_spec_desc': 'Études de Faisabilité & Stratégie de Développement<br>Vision Conceptuelle & Dossiers de Pitch Investisseurs<br>Concours de Design & Prototypes',

            // Collaboration
            'collab_subtitle': 'Collaboration —',
            'collab_title': 'Travaillons ensemble.',
            'collab_text': 'Parlez-nous de votre projet — nous aiderons à le façonner de l’idée à la livraison',
            'collab_btn': 'Contactez-nous',

            // Mission & Vision
            'footer_mission_vision_title': 'MISSION & VISION',
            'footer_mission_subtitle': 'MISSION',
            'footer_mission_desc': 'Notre mission est de façonner l\'avenir de l\'architecture africaine en alliant innovation, durabilité et identité culturelle. Nous nous efforçons de créer des espaces qui inspirent, connectent et perdurent, favorisant la croissance et la résilience à travers le continent.',
            'footer_vision_subtitle': 'VISION',
            'footer_vision_desc': 'Notre vision est d\'être le partenaire architectural de référence en Afrique, favorisant un développement transformateur grâce à une conception et une exécution stratégiques. Nous visons à construire un héritage d\'excellence, en reliant l\'expertise mondiale à la pertinence locale pour libérer le potentiel de chaque projet.',

            // Footer Common
            'footer_links_title': 'LIENS',
            'footer_home': 'Accueil',
            'footer_about': 'À Propos',
            'footer_services': 'Services',
            'footer_africa': 'Afrique',
            'footer_rise': 'RISE',
            'footer_social': 'Social',
            'footer_projects': 'Projets',
            'footer_news': 'Actualités',
            'footer_contact': 'Contact',
            'footer_contact_us_title': 'NOUS CONTACTER',
            'footer_address_title': 'Adresse',
            'footer_address_content': '45, Rue Saint Georges 11324 Port Louis, Maurice',
            'footer_mail_title': 'Email',
            'footer_call_title': 'Téléphone',
            'footer_hours_title': 'Heures d\'ouverture',
            'footer_hours_content': 'Lundi - Vendredi : 8h00 - 17h00',
            'footer_our_projects_title': 'NOS PROJETS',
            'footer_all_projects': 'Tous les Projets'
        }
    };

    function updatePageContent(lang) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[lang][key];
                } else {
                    element.innerHTML = translations[lang][key];
                }
            }
        });

        // Split Title Logic for "SERVICES", "TYPE OF PROJECTS", "Let's work together"
        // These titles are animated word by word, so we need to rebuild them carefully or update the parent container.

        // Handling "SERVICES" animated title
        const servicesTitle = document.querySelector('[data-i18n-group="intro_title"]');
        if (servicesTitle && translations[lang]['intro_title']) {
            // For simplicity in this non-react setup, we might replace the inner content structure 
            // or just update text if the structure is simple.
            // The structure is <h1 class="qodef-m-title"><span class="qodef-e-word-holder">SERVICES</span></h1>
            // Since "SERVICES" is one word, we can just update the text content of the span.
            const wordHolder = servicesTitle.querySelector('.qodef-e-word-holder');
            if (wordHolder) wordHolder.textContent = translations[lang]['intro_title'];
        }

        // Handling "TYPE OF PROJECTS" (Multi-word)
        // Structure: <span class="qodef-e-word">TYPE</span> <span class="qodef-e-word">OF</span> ...
        // We will replace the innerHTML of the h1 with new spans based on the translated string.
        const typeTitle = document.querySelector('[data-i18n-group="type_title"]');
        if (typeTitle && translations[lang]['type_title']) {
            const words = translations[lang]['type_title'].split(' ');
            const newHTML = words.map(word => `<span class="qodef-e-word" style="display: inline-block; opacity: 1; visibility: visible; transform: translate(0px, 0px);">${word}</span>`).join(' ');
            typeTitle.innerHTML = newHTML;
        }

        // Handling "Let's work together." (Multi-line / Multi-word)
        // Original: <span class="qodef-e-word-holder">Let's</span> <span class="qodef-e-word-holder">work</span><br> <span class="qodef-e-word-holder">together.</span><br>
        const collabTitle = document.querySelector('[data-i18n-group="collab_title"]');
        if (collabTitle && translations[lang]['collab_title']) {
            // Simplified replacement strategy: just standard text or spans, preserving breaks if possible
            // Or just replace text content if animation is not critical to precise structure
            const text = translations[lang]['collab_title']; // "Travaillons ensemble."
            // Split by space?
            const words = text.split(' ');
            // Rebuild roughly
            const newHTML = words.map(word => `<span class="qodef-e-word-holder" style="display: inline-block; opacity: 1; visibility: visible; transform: translate(0px, 0px);">${word}</span>`).join(' ');
            collabTitle.innerHTML = newHTML;
        }

        // Update Language Button State
        const languageBtn = document.querySelector('.aboutus-language-btn');
        if (languageBtn) {
            languageBtn.classList.toggle('active', lang === 'FR');
        }

        // Force layout recalculation for Accordion and Parallax
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    // Listen to custom event from language.js
    window.addEventListener('languageChanged', function (e) {
        updatePageContent(e.detail.language);
    });

    // Initial load
    document.addEventListener('DOMContentLoaded', function () {
        const storedLang = localStorage.getItem('currentLanguage') || 'EN';
        updatePageContent(storedLang);

        // Ensure language.js UI is sync (if global script runs after)
        // But we also rely on language.js to trigger the event.
    });

})();
