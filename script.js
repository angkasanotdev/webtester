document.addEventListener('DOMContentLoaded', async () => {
    const DOM = {
        loadingScreen: document.getElementById('loadingScreen'),
        body: document.body,
        sideNav: document.querySelector('.side-nav'),
        mainWrapper: document.querySelector('.main-wrapper'),
        navCollapseBtn: document.querySelector('.nav-collapse-btn'),
        menuToggle: document.querySelector('.menu-toggle'),
        themeToggle: document.getElementById('themeToggle'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearch'),
        apiContent: document.getElementById('apiContent'),
        notificationToast: document.getElementById('notificationToast'),
        notificationBell: document.getElementById('notificationBell'),
        notificationBadge: document.getElementById('notificationBadge'),
        modal: {
            instance: null,
            element: document.getElementById('apiResponseModal'),
            label: document.getElementById('apiResponseModalLabel'),
            desc: document.getElementById('apiResponseModalDesc'),
            content: document.getElementById('apiResponseContent'),
            container: document.getElementById('responseContainer'),
            endpoint: document.getElementById('apiEndpoint'),
            spinner: document.getElementById('apiResponseLoading'),
            queryInputContainer: document.getElementById('apiQueryInputContainer'),
            submitBtn: document.getElementById('submitQueryBtn'),
            copyEndpointBtn: document.getElementById('copyEndpoint'),
            copyResponseBtn: document.getElementById('copyResponse')
        },
        pageTitle: document.getElementById('page'),
        wm: document.getElementById('wm'),
        appName: document.getElementById('name'),
        sideNavName: document.getElementById('sideNavName'),
        versionBadge: document.getElementById('version'),
        versionHeaderBadge: document.getElementById('versionHeader'),
        appDescription: document.getElementById('description'),
        dynamicImage: document.getElementById('dynamicImage'),
        apiLinksContainer: document.getElementById('apiLinks')
    };

    let settings = {};
    let currentApiData = null;
    let allNotifications = [];

    const createSnowEffect = () => {
        const snowContainer = document.createElement('div');
        snowContainer.className = 'snow-container';
        DOM.body.appendChild(snowContainer);
        const snowflakeCount = window.innerWidth < 768 ? 50 : 100;

        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.width = `${Math.random() * 5 + 2}px`;
            snowflake.style.height = snowflake.style.width;
            snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`;
            snowflake.style.animationDelay = `${Math.random() * 10}s`;
            snowContainer.appendChild(snowflake);
        }

        window.addEventListener('resize', () => {
            snowContainer.innerHTML = '';
            const newSnowflakeCount = window.innerWidth < 768 ? 50 : 100;
            for (let i = 0; i < newSnowflakeCount; i++) {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.style.left = `${Math.random() * 100}%`;
                snowflake.style.width = `${Math.random() * 5 + 2}px`;
                snowflake.style.height = snowflake.style.width;
                snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`;
                snowflake.style.animationDelay = `${Math.random() * 10}s`;
                snowContainer.appendChild(snowflake);
            }
        });
    };

    const showToast = (message, type = 'info', title = 'Notification') => {
        if (!DOM.notificationToast) return;
        const toastBody = DOM.notificationToast.querySelector('.toast-body');
        const toastTitleEl = DOM.notificationToast.querySelector('.toast-title');
        const toastIcon = DOM.notificationToast.querySelector('.toast-icon');

        toastBody.textContent = message;
        toastTitleEl.textContent = title;

        const typeConfig = {
            success: { color: '#28a745', icon: 'fa-check-circle' },
            error: { color: '#dc3545', icon: 'fa-exclamation-circle' },
            info: { color: '#007bff', icon: 'fa-info-circle' },
            notification: { color: '#17a2b8', icon: 'fa-bell' }
        };

        const config = typeConfig[type] || typeConfig.info;

        DOM.notificationToast.style.borderLeftColor = config.color;
        toastIcon.className = `toast-icon fas ${config.icon} me-2`;
        toastIcon.style.color = config.color;

        bootstrap.Toast.getOrCreateInstance(DOM.notificationToast).show();
    };

    const copyToClipboard = async (text, btnElement) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalIcon = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            btnElement.classList.add('copy-success');
            showToast('Copied to clipboard!', 'success');
            setTimeout(() => {
                btnElement.innerHTML = originalIcon;
                btnElement.classList.remove('copy-success');
            }, 1500);
        } catch (err) {
            showToast('Failed to copy: ' + err.message, 'error');
        }
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const loadNotifications = async () => {
        try {
            const response = await fetch('/notifications.json');
            if (!response.ok) throw new Error(`Failed to load notifications: ${response.status}`);
            allNotifications = await response.json();
            updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const getSessionReadNotificationIds = () => {
        return JSON.parse(sessionStorage.getItem('sessionReadNotificationIds') || '[]');
    };

    const addSessionReadNotificationId = (id) => {
        const ids = getSessionReadNotificationIds();
        if (!ids.includes(id)) {
            ids.push(id);
            sessionStorage.setItem('sessionReadNotificationIds', JSON.stringify(ids));
        }
    };

    const updateNotificationBadge = () => {
        if (!DOM.notificationBadge) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionReadIds = getSessionReadNotificationIds();
        const unreadNotifications = allNotifications.filter(notif => {
            const notificationDate = new Date(notif.date);
            notificationDate.setHours(0, 0, 0, 0);
            return !notif.read && notificationDate <= today && !sessionReadIds.includes(notif.id);
        });

        DOM.notificationBadge.classList.toggle('active', unreadNotifications.length > 0);
        DOM.notificationBell.setAttribute('aria-label', unreadNotifications.length > 0 
            ? `Notifications (${unreadNotifications.length} unread)` 
            : 'No new notifications');
    };

    const handleNotificationBellClick = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionReadIds = getSessionReadNotificationIds();
        const notificationsToShow = allNotifications.filter(notif => {
            const notificationDate = new Date(notif.date);
            notificationDate.setHours(0, 0, 0, 0);
            return !notif.read && notificationDate <= today && !sessionReadIds.includes(notif.id);
        });

        if (notificationsToShow.length > 0) {
            notificationsToShow.forEach(notif => {
                showToast(notif.message, 'notification', `Notification (${new Date(notif.date).toLocaleDateString('en-US')})`);
                addSessionReadNotificationId(notif.id);
            });
        } else {
            showToast('No new notifications.', 'info');
        }
        updateNotificationBadge();
    };

    const init = async () => {
        setupEventListeners();
        initTheme();
        initSideNav();
        initModal();
        createSnowEffect();
        await loadNotifications();

        try {
            const response = await fetch('/src/settings.json');
            if (!response.ok) throw new Error(`Failed to load settings: ${response.status}`);
            settings = await response.json();
            populatePageContent();
            renderApiCategories();
            observeApiItems();
        } catch (error) {
            console.error('Error loading settings:', error);
            showToast(`Failed to load settings: ${error.message}`, 'error');
            displayErrorState('Unable to load API configuration.');
        } finally {
            hideLoadingScreen();
        }
    };

    const setupEventListeners = () => {
        DOM.navCollapseBtn?.addEventListener('click', toggleSideNavCollapse);
        DOM.menuToggle?.addEventListener('click', toggleSideNavMobile);
        DOM.themeToggle?.addEventListener('change', handleThemeToggle);
        DOM.searchInput?.addEventListener('input', debounce(handleSearch, 300));
        DOM.clearSearchBtn?.addEventListener('click', clearSearch);
        DOM.notificationBell?.addEventListener('click', handleNotificationBellClick);
        DOM.apiContent?.addEventListener('click', handleApiGetButtonClick);
        DOM.modal.copyEndpointBtn?.addEventListener('click', () => copyToClipboard(DOM.modal.endpoint.textContent, DOM.modal.copyEndpointBtn));
        DOM.modal.copyResponseBtn?.addEventListener('click', () => copyToClipboard(DOM.modal.content.textContent, DOM.modal.copyResponseBtn));
        DOM.modal.submitBtn?.addEventListener('click', handleSubmitQuery);
        window.addEventListener('scroll', handleScroll);
        document.addEventListener('click', closeSideNavOnClickOutside);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange);
    };

    const hideLoadingScreen = () => {
        if (!DOM.loadingScreen) return;
        clearInterval(DOM.loadingScreen.querySelector('.loading-dots')?.intervalId);
        DOM.loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            DOM.loadingScreen.style.display = 'none';
            DOM.body.classList.remove('no-scroll');
        }, 500);
    };

    const animateLoadingDots = () => {
        const loadingDots = DOM.loadingScreen?.querySelector('.loading-dots');
        if (loadingDots) {
            loadingDots.intervalId = setInterval(() => {
                loadingDots.textContent = loadingDots.textContent.length >= 3 ? '.' : loadingDots.textContent + '.';
            }, 500);
        }
    };
    animateLoadingDots();

    const initTheme = () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        DOM.body.classList.toggle('dark-mode', isDark);
        DOM.themeToggle.checked = isDark;
        updateThemeStyles(isDark);
    };

    const handleThemeToggle = () => {
        const isDark = DOM.themeToggle.checked;
        DOM.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeStyles(isDark);
        showToast(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'success');
    };

    const handleSystemThemeChange = (e) => {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            const isDark = e.matches;
            DOM.body.classList.toggle('dark-mode', isDark);
            DOM.themeToggle.checked = isDark;
            updateThemeStyles(isDark);
        }
    };

    const updateThemeStyles = (isDark) => {
        const root = document.documentElement;
        const themeColors = {
            light: {
                '--primary-color': '#007bff',
                '--primary-hover': '#0056b3',
                '--secondary-color': '#6c757d',
                '--accent-color': '#17a2b8',
                '--background-color': '#f8f9fa',
                '--card-background': '#ffffff',
                '--text-color': '#212529',
                '--text-muted': '#6c757d',
                '--border-color': 'rgba(0, 0, 0, 0.1)',
                '--highlight-color': 'rgba(0, 123, 255, 0.1)',
                '--background-color-rgb': '248, 249, 250'
            },
            dark: {
                '--primary-color': '#1a1a1a',
                '--primary-hover': '#2d2d2d',
                '--secondary-color': '#262626',
                '--accent-color': '#333333',
                '--background-color': '#0f0f0f',
                '--card-background': '#1c1c1c',
                '--text-color': '#d4d4d4',
                '--text-muted': '#666666',
                '--border-color': 'rgba(26, 26, 26, 0.5)',
                '--highlight-color': 'rgba(45, 45, 45, 0.7)',
                '--background-color-rgb': '15, 15, 15'
            }
        };

        Object.entries(themeColors[isDark ? 'dark' : 'light']).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };

    const initSideNav = () => {
        if (DOM.sideNav && DOM.navCollapseBtn) {
            DOM.navCollapseBtn.setAttribute('aria-expanded', !DOM.sideNav.classList.contains('collapsed'));
        }
    };

    const toggleSideNavCollapse = () => {
        DOM.sideNav?.classList.toggle('collapsed');
        DOM.mainWrapper?.classList.toggle('nav-collapsed');
        DOM.navCollapseBtn?.setAttribute('aria-expanded', !DOM.sideNav.classList.contains('collapsed'));
    };

    const toggleSideNavMobile = () => {
        DOM.sideNav?.classList.toggle('active');
        DOM.menuToggle?.setAttribute('aria-expanded', DOM.sideNav.classList.contains('active'));
    };

    const closeSideNavOnClickOutside = (e) => {
        if (window.innerWidth < 992 && DOM.sideNav?.classList.contains('active') &&
            !DOM.sideNav.contains(e.target) && !DOM.menuToggle?.contains(e.target)) {
            DOM.sideNav.classList.remove('active');
            DOM.menuToggle.setAttribute('aria-expanded', 'false');
        }
    };

    const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const headerHeight = document.querySelector('.main-header')?.offsetHeight || 70;

        document.querySelectorAll('section[id]').forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 20;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.side-nav-link[href="#${sectionId}"]`);

            if (navLink && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.side-nav-link.active').forEach(l => {
                    l.classList.remove('active');
                    l.removeAttribute('aria-current');
                });
                navLink.classList.add('active');
                navLink.setAttribute('aria-current', 'page');
            }
        });
    };

    const initModal = () => {
        if (DOM.modal.element) {
            DOM.modal.instance = new bootstrap.Modal(DOM.modal.element, { backdrop: 'static' });
        }
    };

    const setPageContent = (element, value, fallback = '') => {
        if (element) element.textContent = value || fallback;
    };

    const setPageAttribute = (element, attribute, value, fallback = '') => {
        if (element) element.setAttribute(attribute, value || fallback);
    };

    const populatePageContent = () => {
        if (!settings || !Object.keys(settings).length) return;

        const currentYear = new Date().getFullYear();
        const creator = settings.apiSettings?.creator || 'FlowFalcon';

        setPageContent(DOM.pageTitle, settings.name, 'Falcon API');
        setPageContent(DOM.wm, `© ${currentYear} ${creator}. All rights reserved.`);
        setPageContent(DOM.appName, settings.name, 'Falcon API');
        setPageContent(DOM.sideNavName, settings.name, 'API');
        setPageContent(DOM.versionBadge, settings.version, 'v1.0');
        setPageContent(DOM.versionHeaderBadge, settings.header?.status, 'Active!');
        setPageContent(DOM.appDescription, settings.description, 'Simple and user-friendly API documentation.');

        if (DOM.dynamicImage) {
            DOM.dynamicImage.src = settings.bannerImage || '/src/banner.jpg';
            DOM.dynamicImage.alt = settings.name ? `${settings.name} Banner` : 'API Banner';
            DOM.dynamicImage.style.display = '';
            DOM.dynamicImage.onerror = () => {
                DOM.dynamicImage.src = '/src/banner.jpg';
                DOM.dynamicImage.alt = 'API Banner Fallback';
                showToast('Failed to load banner image, using default.', 'warning');
            };
        }

        if (DOM.apiLinksContainer) {
            DOM.apiLinksContainer.innerHTML = '';
            (settings.links || []).forEach(({ url, name, icon }, index) => {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'api-link btn btn-primary';
                link.style.animationDelay = `${index * 0.1}s`;
                link.setAttribute('aria-label', name);
                link.innerHTML = `<i class="${icon || 'fas fa-external-link-alt'}" aria-hidden="true"></i> ${name}`;
                DOM.apiLinksContainer.appendChild(link);
            });
        }
    };

    const renderApiCategories = () => {
        if (!DOM.apiContent || !settings.categories?.length) {
            displayErrorState('No API categories found.');
            return;
        }
        DOM.apiContent.innerHTML = '';

        settings.categories.forEach((category, categoryIndex) => {
            const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name));
            const categorySection = document.createElement('section');
            categorySection.id = `category-${category.name.toLowerCase().replace(/\s+/g, '-')}`;
            categorySection.className = 'category-section';
            categorySection.style.animationDelay = `${categoryIndex * 0.15}s`;
            categorySection.setAttribute('aria-labelledby', `category-title-${categoryIndex}`);

            const categoryHeader = document.createElement('h3');
            categoryHeader.id = `category-title-${categoryIndex}`;
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = category.icon ? `<i class="${category.icon} me-2" aria-hidden="true"></i>${category.name}` : category.name;
            categorySection.appendChild(categoryHeader);

            if (category.image) {
                const img = document.createElement('img');
                img.src = category.image;
                img.alt = `${category.name} banner`;
                img.className = 'category-image img-fluid rounded mb-3 shadow-sm';
                img.loading = 'lazy';
                categorySection.appendChild(img);
            }

            const itemsRow = document.createElement('div');
            itemsRow.className = 'row';

            sortedItems.forEach((item, itemIndex) => {
                const itemCol = document.createElement('div');
                itemCol.className = 'col-12 col-md-6 col-lg-4 api-item';
                itemCol.dataset.name = item.name;
                itemCol.dataset.desc = item.desc;
                itemCol.dataset.category = category.name;
                itemCol.style.animationDelay = `${itemIndex * 0.05 + 0.2}s`;

                const apiCard = document.createElement('article');
                apiCard.className = 'api-card h-100';
                apiCard.setAttribute('aria-labelledby', `api-title-${categoryIndex}-${itemIndex}`);

                const cardInfo = document.createElement('div');
                cardInfo.className = 'api-card-info';

                const itemTitle = document.createElement('h5');
                itemTitle.id = `api-title-${categoryIndex}-${itemIndex}`;
                itemTitle.className = 'mb-1';
                itemTitle.textContent = item.name;

                const itemDesc = document.createElement('p');
                itemDesc.className = 'text-muted mb-0';
                itemDesc.textContent = item.desc;

                cardInfo.appendChild(itemTitle);
                cardInfo.appendChild(itemDesc);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'api-actions mt-auto';

                const getBtn = document.createElement('button');
                getBtn.type = 'button';
                getBtn.className = 'btn get-api-btn btn-sm';
                getBtn.innerHTML = '<i class="fas fa-code me-1" aria-hidden="true"></i> GET';
                getBtn.dataset.apiPath = item.path;
                getBtn.dataset.apiName = item.name;
                getBtn.dataset.apiDesc = item.desc;
                if (item.params) getBtn.dataset.apiParams = JSON.stringify(item.params);
                if (item.innerDesc) getBtn.dataset.apiInnerDesc = item.innerDesc;
                getBtn.setAttribute('aria-label', `Get details for ${item.name}`);

                const statusConfig = {
                    ready: { class: 'status-ready', icon: 'fa-circle', text: 'Ready' },
                    error: { class: 'status-error', icon: 'fa-exclamation-triangle', text: 'Error' },
                    update: { class: 'status-update', icon: 'fa-arrow-up', text: 'Update' }
                };
                const status = statusConfig[item.status || 'ready'];

                if (item.status === 'error' || item.status === 'update') {
                    getBtn.disabled = true;
                    apiCard.classList.add('api-card-unavailable');
                    getBtn.title = `API is in '${item.status}' status and temporarily unavailable.`;
                }

                const statusIndicator = document.createElement('div');
                statusIndicator.className = `api-status ${status.class}`;
                statusIndicator.title = `Status: ${status.text}`;
                statusIndicator.innerHTML = `<i class="fas ${status.icon} me-1" aria-hidden="true"></i><span>${status.text}</span>`;

                actionsDiv.appendChild(getBtn);
                actionsDiv.appendChild(statusIndicator);
                apiCard.appendChild(cardInfo);
                apiCard.appendChild(actionsDiv);
                itemCol.appendChild(apiCard);
                itemsRow.appendChild(itemCol);
            });

            categorySection.appendChild(itemsRow);
            DOM.apiContent.appendChild(categorySection);
        });
        initializeTooltips();
    };

    const displayErrorState = (message) => {
        if (!DOM.apiContent) return;
        DOM.apiContent.innerHTML = `
            <div class="no-results-message text-center p-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="h5">${message}</p>
                <p class="text-muted">Please try reloading the page or contact the administrator.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="fas fa-sync-alt me-2"></i> Reload
                </button>
            </div>`;
    };

    const handleSearch = () => {
        if (!DOM.searchInput || !DOM.apiContent) return;
        const searchTerm = DOM.searchInput.value.toLowerCase().trim();
        DOM.clearSearchBtn.classList.toggle('visible', searchTerm.length > 0);

        const apiItems = DOM.apiContent.querySelectorAll('.api-item');
        const visibleCategories = new Set();

        apiItems.forEach(item => {
            const matches = [item.dataset.name, item.dataset.desc, item.dataset.category]
                .some(val => val?.toLowerCase().includes(searchTerm));
            item.style.display = matches ? '' : 'none';
            if (matches) visibleCategories.add(item.closest('.category-section'));
        });

        DOM.apiContent.querySelectorAll('.category-section').forEach(section => {
            section.style.display = visibleCategories.has(section) ? '' : 'none';
        });

        const noResultsMsg = DOM.apiContent.querySelector('#noResultsMessage') || createNoResultsMessage();
        noResultsMsg.style.display = visibleCategories.size === 0 && searchTerm ? 'flex' : 'none';
        if (visibleCategories.size === 0 && searchTerm) noResultsMsg.querySelector('span').textContent = `"${searchTerm}"`;
    };

    const clearSearch = () => {
        if (!DOM.searchInput) return;
        DOM.searchInput.value = '';
        DOM.searchInput.focus();
        handleSearch();
        DOM.searchInput.classList.add('shake-animation');
        setTimeout(() => DOM.searchInput.classList.remove('shake-animation'), 400);
    };

    const createNoResultsMessage = () => {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'no-results-message flex-column align-items-center justify-content-center p-5 text-center';
        noResultsMsg.style.display = 'none';
        noResultsMsg.innerHTML = `
            <i class="fas fa-search fa-3x text-muted mb-3"></i>
            <p class="h5">No results for <span></span></p>
            <button id="clearSearchFromMsg" class="btn btn-primary mt-3">
                <i class="fas fa-times me-2"></i> Clear Search
            </button>`;
        DOM.apiContent.appendChild(noResultsMsg);
        document.getElementById('clearSearchFromMsg').addEventListener('click', clearSearch);
        return noResultsMsg;
    };

    const handleApiGetButtonClick = (event) => {
        const getApiBtn = event.target.closest('.get-api-btn');
        if (!getApiBtn || getApiBtn.disabled) return;

        getApiBtn.classList.add('pulse-animation');
        setTimeout(() => getApiBtn.classList.remove('pulse-animation'), 300);

        currentApiData = {
            path: getApiBtn.dataset.apiPath,
            name: getApiBtn.dataset.apiName,
            desc: getApiBtn.dataset.apiDesc,
            params: getApiBtn.dataset.apiParams ? JSON.parse(getApiBtn.dataset.apiParams) : null,
            innerDesc: getApiBtn.dataset.apiInnerDesc
        };

        setupModalForApi(currentApiData);
        DOM.modal.instance.show();
    };

    const setupModalForApi = (apiData) => {
        DOM.modal.label.textContent = apiData.name;
        DOM.modal.desc.textContent = apiData.desc;
        DOM.modal.content.innerHTML = '';
        DOM.modal.endpoint.textContent = `${window.location.origin}${apiData.path.split('?')[0]}`;
        DOM.modal.spinner.classList.add('d-none');
        DOM.modal.content.classList.add('d-none');
        DOM.modal.container.classList.add('d-none');
        DOM.modal.endpoint.classList.remove('d-none');
        DOM.modal.queryInputContainer.innerHTML = '';
        DOM.modal.submitBtn.classList.add('d-none');
        DOM.modal.submitBtn.disabled = true;
        DOM.modal.submitBtn.innerHTML = '<span>Submit</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>';

        const paramsFromPath = new URLSearchParams(apiData.path.split('?')[1]);
        const paramKeys = Array.from(paramsFromPath.keys());

        if (paramKeys.length > 0) {
            const paramContainer = document.createElement('div');
            paramContainer.className = 'param-container';

            const formTitle = document.createElement('h6');
            formTitle.className = 'param-form-title';
            formTitle.innerHTML = '<i class="fas fa-sliders-h me-2" aria-hidden="true"></i> Parameters';
            paramContainer.appendChild(formTitle);

            paramKeys.forEach(paramKey => {
                const paramGroup = document.createElement('div');
                paramGroup.className = 'param-group mb-3';

                const labelContainer = document.createElement('div');
                labelContainer.className = 'param-label-container';
                const label = document.createElement('label');
                label.className = 'form-label';
                label.textContent = paramKey;
                label.htmlFor = `param-${paramKey}`;
                label.innerHTML += '<span class="required-indicator ms-1">*</span>';
                labelContainer.appendChild(label);

                if (apiData.params?.[paramKey]) {
                    const tooltipIcon = document.createElement('i');
                    tooltipIcon.className = 'fas fa-info-circle param-info ms-1';
                    tooltipIcon.setAttribute('data-bs-toggle', 'tooltip');
                    tooltipIcon.setAttribute('data-bs-placement', 'top');
                    tooltipIcon.title = apiData.params[paramKey];
                    labelContainer.appendChild(tooltipIcon);
                }
                paramGroup.appendChild(labelContainer);

                const inputContainer = document.createElement('div');
                inputContainer.className = 'input-container';
                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.className = 'form-control custom-input';
                inputField.id = `param-${paramKey}`;
                inputField.placeholder = `Enter ${paramKey}...`;
                inputField.dataset.param = paramKey;
                inputField.required = true;
                inputField.autocomplete = 'off';
                inputField.addEventListener('input', validateModalInputs);
                inputContainer.appendChild(inputField);
                paramGroup.appendChild(inputContainer);
                paramContainer.appendChild(paramGroup);
            });

            if (apiData.innerDesc) {
                const innerDescDiv = document.createElement('div');
                innerDescDiv.className = 'inner-desc mt-3';
                innerDescDiv.innerHTML = `<i class="fas fa-info-circle me-2" aria-hidden="true"></i> ${apiData.innerDesc.replace(/\n/g, '<br>')}`;
                paramContainer.appendChild(innerDescDiv);
            }

            DOM.modal.queryInputContainer.appendChild(paramContainer);
            DOM.modal.submitBtn.classList.remove('d-none');
            initializeTooltips(DOM.modal.queryInputContainer);
        } else {
            handleApiRequest(`${window.location.origin}${apiData.path}`, apiData.name);
        }
    };

    const validateModalInputs = () => {
        const inputs = DOM.modal.queryInputContainer.querySelectorAll('input[required]');
        const allFilled = Array.from(inputs).every(input => input.value.trim());
        DOM.modal.submitBtn.disabled = !allFilled;
        DOM.modal.submitBtn.classList.toggle('btn-active', allFilled);

        inputs.forEach(input => input.classList.toggle('is-invalid', !input.value.trim()));
        const errorMsg = DOM.modal.queryInputContainer.querySelector('.alert.alert-danger');
        if (errorMsg && allFilled) {
            errorMsg.classList.replace('fade-in', 'fade-out');
            setTimeout(() => errorMsg.remove(), 300);
        }
    };

    const handleSubmitQuery = async () => {
        if (!currentApiData) return;

        const inputs = DOM.modal.queryInputContainer.querySelectorAll('input');
        const newParams = new URLSearchParams();
        let isValid = true;

        inputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');
                input.parentElement.classList.add('shake-animation');
                setTimeout(() => input.parentElement.classList.remove('shake-animation'), 500);
            } else if (input.value.trim()) {
                newParams.append(input.dataset.param, input.value.trim());
            }
        });

        if (!isValid) {
            let errorMsg = DOM.modal.queryInputContainer.querySelector('.alert.alert-danger');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'alert alert-danger mt-3 fade-in';
                errorMsg.setAttribute('role', 'alert');
                errorMsg.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> Please fill all required fields.';
                DOM.modal.queryInputContainer.appendChild(errorMsg);
            }
            DOM.modal.submitBtn.classList.add('shake-animation');
            setTimeout(() => DOM.modal.submitBtn.classList.remove('shake-animation'), 500);
            return;
        }

        DOM.modal.submitBtn.disabled = true;
        DOM.modal.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...';

        const apiUrlWithParams = `${window.location.origin}${currentApiData.path.split('?')[0]}?${newParams.toString()}`;
        DOM.modal.endpoint.textContent = apiUrlWithParams;

        if (DOM.modal.queryInputContainer.firstChild) {
            DOM.modal.queryInputContainer.firstChild.classList.add('fade-out');
            setTimeout(() => DOM.modal.queryInputContainer.firstChild.style.display = 'none', 300);
        }

        await handleApiRequest(apiUrlWithParams, currentApiData.name);
    };

    const handleApiRequest = async (apiUrl, apiName) => {
        DOM.modal.spinner.classList.remove('d-none');
        DOM.modal.container.classList.add('d-none');
        DOM.modal.content.innerHTML = '';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const contentType = response.headers.get('Content-Type');
            if (contentType?.includes('image/')) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = apiName;
                img.className = 'response-image img-fluid rounded shadow-sm fade-in';

                const downloadBtn = document.createElement('a');
                downloadBtn.href = imageUrl;
                downloadBtn.download = `${apiName.toLowerCase().replace(/\s+/g, '-')}.${blob.type.split('/')[1] || 'png'}`;
                downloadBtn.className = 'btn btn-primary mt-3 w-100';
                downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i> Download Image';

                DOM.modal.content.appendChild(img);
                DOM.modal.content.appendChild(downloadBtn);
            } else if (contentType?.includes('application/json')) {
                const data = await response.json();
                const formattedJson = syntaxHighlightJson(JSON.stringify(data, null, 2));
                DOM.modal.content.innerHTML = formattedJson;
                if (JSON.stringify(data, null, 2).split('\n').length > 20) {
                    addCodeFolding(DOM.modal.content);
                }
            } else {
                const textData = await response.text();
                DOM.modal.content.textContent = textData || 'Response has no content or unrecognized format.';
            }

            DOM.modal.container.classList.remove('d-none');
            DOM.modal.content.classList.remove('d-none');
            DOM.modal.container.classList.add('slide-in-bottom');
            showToast(`Successfully fetched data for ${apiName}`, 'success');
        } catch (error) {
            console.error('API Request Error:', error);
            DOM.modal.content.innerHTML = `
                <div class="error-container text-center p-3">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                    <h6 class="text-danger">Error Occurred</h6>
                    <p class="text-muted small">${error.message || 'Unable to fetch data from server.'}</p>
                    ${currentApiData?.path.includes('?') ? 
                    `<button class="btn btn-sm btn-outline-primary mt-2 retry-query-btn">
                        <i class="fas fa-sync-alt me-1"></i> Retry
                    </button>` : ''}
                </div>`;
            DOM.modal.container.classList.remove('d-none');
            DOM.modal.content.classList.remove('d-none');
            showToast('Failed to fetch data. Check details in modal.', 'error');

            const retryBtn = DOM.modal.content.querySelector('.retry-query-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    if (DOM.modal.queryInputContainer.firstChild) {
                        DOM.modal.queryInputContainer.firstChild.style.display = '';
                        DOM.modal.queryInputContainer.firstChild.classList.remove('fade-out');
                    }
                    DOM.modal.submitBtn.disabled = false;
                    DOM.modal.submitBtn.innerHTML = '<span>Submit</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>';
                    DOM.modal.container.classList.add('d-none');
                };
            }
        } finally {
            DOM.modal.spinner.classList.add('d-none');
            if (DOM.modal.submitBtn && currentApiData?.path.includes('?') && !DOM.modal.content.querySelector('.retry-query-btn')) {
                DOM.modal.submitBtn.disabled = false;
                DOM.modal.submitBtn.innerHTML = '<span>Submit</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>';
            }
        }
    };

    const syntaxHighlightJson = (json) => {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
            let cls = 'json-number';
            if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
            else if (/true|false/.test(match)) cls = 'json-boolean';
            else if (/null/.test(match)) cls = 'json-null';
            return `<span class="${cls}">${match}</span>`;
        });
    };

    const addCodeFolding = (container) => {
        const lines = container.innerHTML.split('\n');
        let currentLevel = 0;
        let foldableHtml = '';
        let inFoldableBlock = false;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
                if (currentLevel === 0) {
                    foldableHtml += `<div class="code-fold-trigger" data-folded="false" role="button" tabindex="0" aria-expanded="true">${line}<span class="fold-indicator ms-2 small text-muted">(<i class="fas fa-chevron-down"></i> Fold)</span></div><div class="code-fold-content">`;
                    inFoldableBlock = true;
                } else {
                    foldableHtml += line + '\n';
                }
                currentLevel++;
            } else if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']')) {
                currentLevel--;
                foldableHtml += line + '\n';
                if (currentLevel === 0 && inFoldableBlock) {
                    foldableHtml += '</div>';
                    inFoldableBlock = false;
                }
            } else {
                foldableHtml += line + (index === lines.length - 1 ? '' : '\n');
            }
        });
        container.innerHTML = foldableHtml;

        container.querySelectorAll('.code-fold-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => toggleFold(trigger));
            trigger.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFold(trigger);
                }
            });
        });
    };

    const toggleFold = (trigger) => {
        const content = trigger.nextElementSibling;
        const isFolded = trigger.dataset.folded === 'true';
        trigger.dataset.folded = !isFolded;
        trigger.setAttribute('aria-expanded', isFolded);
        content.style.maxHeight = isFolded ? content.scrollHeight + 'px' : '0px';
        trigger.querySelector('.fold-indicator').innerHTML = `(<i class="fas fa-chevron-${isFolded ? 'down' : 'up'}"></i> ${isFolded ? 'Fold' : 'Unfold'})`;
    };

    const observeApiItems = () => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view', 'slideInUp');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.api-item:not(.in-view)').forEach(item => observer.observe(item));
    };

    const initializeTooltips = (parentElement = document) => {
        parentElement.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            bootstrap.Tooltip.getInstance(el)?.dispose();
            new bootstrap.Tooltip(el);
        });
    };

    init();
});