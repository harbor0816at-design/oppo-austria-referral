(() => {
  'use strict';

  const STORAGE_KEY = 'oppo_referral_language';
  const supported = ['de', 'en', 'zh'];
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  const lastRendered = new WeakMap();
  let applying = false;
  let current = normalize(localStorage.getItem(STORAGE_KEY) || 'de');

  const translations = {
    en: {
      'Übersicht': 'Overview',
      'Empfehlungen': 'Referrals',
      'Produkte & Prämien': 'Products & Rewards',
      'Produkte': 'Products',
      'Wissenscenter': 'Knowledge Center',
      'Wissen': 'Knowledge',
      'Konto & Auszahlung': 'Account & Payout',
      'Konto': 'Account',
      'Österreich · AT': 'Austria · AT',
      'Deutsch (AT)': 'German (AT)',
      'English (EU)': 'English (EU)',
      '中文': 'Chinese',
      'Registrieren': 'Register',
      'Anmelden': 'Sign in',
      'Abmelden': 'Sign out',
      'Offizielles OPPO Österreich Empfehlungsprogramm': 'Official OPPO Austria Referral Program',
      'OPPO Austria Empfehlungsprogramm': 'OPPO Austria Referral Program',
      'Freunde für Flaggschiff-Innovation begeistern.': 'Share flagship innovation with friends.',
      'Bis zu €100 Prämie je Empfehlung erhalten.': 'Earn up to €100 per successful referral.',
      'Teilen Sie exklusive Store-Vorteile mit Ihrem persönlichen Referral-Link. Nach erfolgreichem Kauf erhalten Sie Ihr Guthaben unkompliziert per Banküberweisung oder Store-Gutschrift.': 'Share exclusive store benefits with your personal referral link. After a successful purchase, your reward is credited to your referral account.',
      'Jetzt kostenlos registrieren': 'Register for free',
      'Jetzt registrieren': 'Register now',
      'Bereits registriert? Anmelden': 'Already registered? Sign in',
      'Freunde empfehlen.': 'Refer friends.',
      'Vorteile erhalten.': 'Earn rewards.',
      'Empfehlen Sie OPPO und profitieren Sie von bis zu €100 Prämie je erfolgreicher Empfehlung.': 'Recommend OPPO and earn up to €100 for each successful referral.',
      'Schritt 01': 'Step 01',
      'Schritt 02': 'Step 02',
      'Schritt 03': 'Step 03',
      'In 3 einfachen Schritten': 'In 3 simple steps',
      'Registrieren & Code sichern': 'Register & get your code',
      'In unter 2 Minuten teilnehmen. Als verifizierter Besitzer erhalten Sie direkten Zugriff auf Ihren persönlichen Empfehlungscode.': 'Join in under two minutes and get direct access to your personal referral code.',
      'Link oder QR-Code teilen': 'Share link or QR code',
      'Link teilen': 'Share link',
      'Teilen Sie Produktlinks oder Ihren Code direkt per WhatsApp, E-Mail oder QR-Code auf Social Media und im Bekanntenkreis.': 'Share product links or your code via WhatsApp, email, QR code or social media.',
      'Prämie flexibel auszahlen': 'Use your reward flexibly',
      'Belohnung erhalten': 'Receive your reward',
      'Sobald die 30-tägige Widerrufsfrist abgelaufen ist, lassen Sie sich Ihr Guthaben auf Ihr Bankkonto oder als OPPO Gutschein mit +10% Bonus auszahlen.': 'Once the applicable return period has ended, eligible rewards become available in your referral account.',
      'Kostenlos Konto anlegen & persönlichen Code sichern.': 'Create a free account and secure your personal code.',
      'Empfehlungslink oder QR-Code an Kontakte senden.': 'Send your referral link or QR code to contacts.',
      'Bis zu €50–€100 Gutschrift nach Gerätekauf erhalten.': 'Receive up to €50–€100 after a qualifying device purchase.',
      'Direkt als bestehender Kunde einloggen →': 'Existing customer? Sign in directly →',
      'Ihr persönliches OPPO Austria Referral Dashboard mit Echtzeit-Tracking.': 'Your personal OPPO Austria referral dashboard with live tracking.',
      'Ihre Empfehlungen auf einen Blick': 'Your referrals at a glance',
      'Mein QR-Code': 'My QR code',
      'Guthaben auszahlen': 'Use reward',
      'Bereit zur Auszahlung': 'Available reward',
      'Verfügbares Bar-Guthaben': 'Available reward balance',
      'In Prüfung': 'Pending review',
      'Laufende Widerrufsfrist': 'Pending qualification',
      'Erfolgreich weitergeleitet': 'Successful referrals',
      'Erfolgreich geteilt': 'Successful referrals',
      'Bestätigte Käufe': 'Qualified purchases',
      'Ausgelieferte Bestellungen': 'Qualified orders',
      'Verkäufe': 'Sales',
      'Abgeschlossene Käufe': 'Completed purchases',
      'Ihr persönlicher Empfehlungslink': 'Your personal referral link',
      'Ihr Empfehlungslink': 'Your referral link',
      'Freunde sparen bis zu €50 beim Neukauf im offiziellen AT Store': 'Friends can receive up to €50 off a qualifying purchase in the official Austria store',
      'Code:': 'Code:',
      'Link kopieren': 'Copy link',
      'Kopieren': 'Copy',
      'Code kopieren': 'Copy code',
      'E-Mail': 'Email',
      'QR-Code': 'QR code',
      'Letzte Empfehlungsaktivitäten': 'Recent referral activity',
      'Letzte Empfehlungen': 'Recent referrals',
      'Aktuelle Status-Updates von Freunden & Kontakten': 'Latest status updates from friends and contacts',
      'Alle anzeigen': 'View all',
      'Kontakt': 'Contact',
      'Gerät': 'Device',
      'Datum': 'Date',
      'Status': 'Status',
      'Prämie': 'Reward',
      'Bestätigt': 'Qualified',
      'Ausstehend': 'Pending',
      'Storniert': 'Cancelled',
      'In Prüfung (Widerrufsfrist)': 'Pending review',
      'Belohnungskonto': 'Reward account',
      'Belohnungsübersicht': 'Reward overview',
      'Offizielles Gutschriften-Konto Österreich': 'OPPO Austria referral reward account',
      'Aktiv': 'Active',
      'Status: Aktiv': 'Status: Active',
      'Verfügbar': 'Available',
      'Ausbezahlt': 'Paid out',
      'Genutzt': 'Used',
      'Guthaben jetzt auszahlen lassen': 'Use available reward',
      'Guthaben verwenden / Auszahlen': 'Use reward',
      'Guthaben verwenden / auszahlen': 'Use reward',
      'Auszahlung direkt auf Ihr IBAN-Konto (AT) innerhalb von 1-2 Werktagen.': 'Payout features are not enabled in V1. Eligible rewards remain visible in your account.',
      'Referral Mitgliedschaft': 'Referral membership',
      'Ihr Status': 'Your status',
      'Noch 2 bestätigte Empfehlungen bis zum Status': '2 more qualified referrals to reach',
      '8 von 10 Zielen erreicht': '8 of 10 completed',
      'Widerrufsfrist & Prämien-Freigabe': 'Qualification & reward release',
      'Prämien werden exakt 30 Tage nach Kaufabschluss des eingeladenen Kunden gutgeschrieben, sofern keine Rücksendung erfolgt.': 'Rewards are released after the applicable qualification period if the referred purchase remains eligible.',
      'Empfehlungen & Historie': 'Referrals & history',
      'Alle Empfehlungen': 'All referrals',
      'Detaillierte Übersicht über alle über Ihren Link initiierten Käufe.': 'Detailed overview of referrals initiated through your link.',
      'Vollständige Historie aller weitergeleiteten Käufe': 'Complete referral history',
      'Alle': 'All',
      'Empfohlener Käufer': 'Referred customer',
      'Modell': 'Model',
      'Transaktions-ID': 'Transaction ID',
      'Bestelldatum': 'Order date',
      'Ihre Prämie': 'Your reward',
      'Storniert / Widerruf': 'Cancelled / returned',
      'Produkte gezielt empfehlen': 'Recommend specific products',
      'Produkte empfehlen': 'Recommend products',
      'Wählen Sie ein bestimmtes Modell aus und teilen Sie maßgeschneiderte Produkt-Links.': 'Choose a model and share a dedicated product link.',
      'Wählen Sie ein Gerät und teilen Sie den direkten Vorteil': 'Choose a device and share its direct benefit',
      'Flaggschiff': 'Flagship',
      'Top Empfehlung': 'Top recommendation',
      'Top Seller': 'Top seller',
      'Standard': 'Standard',
      'Mittelklasse': 'Mid-range',
      'Link erstellen & teilen': 'Create & share link',
      'Empfehlen': 'Recommend',
      'Ihre Prämie: €50': 'Your reward: €50',
      'Ihre Prämie: €40': 'Your reward: €40',
      'Ihre Prämie: €30': 'Your reward: €30',
      'Wissenscenter & Argumente': 'Knowledge center & talking points',
      'Wissen & Verkaufsargumente': 'Knowledge & talking points',
      'Antworten auf häufige Fragen und fertige Textbausteine für Freunde.': 'Answers to common questions and ready-to-share talking points.',
      'Schnelle Antworten und fertige Textbausteine für Freunde': 'Quick answers and ready-to-share talking points',
      'Verkaufsberater Schnell-Antwort': 'Quick sales answer',
      'Tippen Sie eine Frage ein, die Ihnen ein Freund gestellt hat:': 'Enter a question a friend asked you:',
      'Freund fragt nach...': 'A friend asks about...',
      'Fragen': 'Ask',
      'Ergebnis': 'Answer',
      'Schnell-Antwort': 'Quick answer',
      'Text kopieren': 'Copy text',
      'Antwort kopieren': 'Copy answer',
      'Warum OPPO?': 'Why OPPO?',
      'Flaggschiff-Erlebnis': 'Flagship experience',
      'Warum Find X10 wählen?': 'Why choose Find X10?',
      'Kamera & Hasselblad': 'Camera & Hasselblad',
      'Kamera': 'Camera',
      'Akku & SUPERVOOC': 'Battery & SUPERVOOC',
      'Akku & Laden': 'Battery & charging',
      '100W Schnellladen': '100W fast charging',
      '100W SUPERVOOC Schnellladen': '100W SUPERVOOC fast charging',
      'Service Österreich': 'Service in Austria',
      'Garantie & Service': 'Warranty & service',
      'Lokaler Vor-Ort-Support': 'Local support',
      'Österreichischer Vor-Ort-Support': 'Local support in Austria',
      'Konto & Auszahlungsdaten': 'Account & reward settings',
      'Mein Konto': 'My account',
      'Verwalten Sie Ihre Bankverbindung und persönlichen Einstellungen.': 'Manage your personal account settings.',
      'Persönliche Daten & Auszahlungspräferenzen': 'Personal data & reward preferences',
      'OPPO Kunde · Verifizierung optional': 'OPPO customer · verification optional',
      'Persönlicher Referral Code': 'Personal referral code',
      'Persönlicher Empfehlungscode': 'Personal referral code',
      'Auszahlungskonto (IBAN Österreich)': 'Payout account (Austria IBAN)',
      'Auszahlungsziel (IBAN)': 'Payout destination (IBAN)',
      'Registrierungsdatum': 'Registration date',
      'Registriert seit': 'Registered since',
      'Auszahlung beauftragen': 'Request payout',
      'Auszahlung anfordern': 'Request payout',
      'IBAN ändern': 'Change IBAN',
      'Rechtliche Hinweise & Auszahlungstermine': 'Program terms & reward timing',
      'Programmrichtlinien Österreich': 'Austria program rules',
      'Produktempfehlung': 'Product recommendation',
      'Ihre Prämie bei Kaufabschluss:': 'Your reward after qualification:',
      'Direkter Produktlink:': 'Direct product link:',
      'QR-Code vorzeigen': 'Show QR code',
      'Vor Ort oder auf mobilen Geräten scannen lassen, um direkt im offiziellen OPPO Österreich Store einzukaufen.': 'Let friends scan it to open the official OPPO Austria store.',
      'Freunde scannen lassen, um direkt im österreichischen OPPO Store zu bestellen.': 'Let friends scan it to open the OPPO Austria store.',
      'Auszahlungsantrag': 'Reward request',
      'Guthaben transferieren': 'Use reward balance',
      'Guthabenverwaltung': 'Reward management',
      'Aktuell verfügbares Bar-Guthaben:': 'Currently available reward:',
      'Aktuell verfügbar': 'Currently available',
      'SEPA Banküberweisung': 'SEPA bank transfer',
      'Überweisung auf Bankkonto': 'Bank transfer',
      'OPPO Store AT Gutschein (+10% Bonus)': 'OPPO Store AT voucher (+10% bonus)',
      'Auszahlung jetzt anfordern': 'Request payout',
      'Schritt 1 von 3 · Registrierung': 'Step 1 of 3 · Registration',
      'Schritt 1 von 3 · Konto': 'Step 1 of 3 · Account',
      'Vorname': 'First name',
      'Nachname': 'Last name',
      'E-Mail Adresse': 'Email address',
      'Passwort': 'Password',
      'Weiter': 'Continue',
      'Zurück': 'Back',
      'Haben Sie bereits ein OPPO Smartphone in Österreich erworben?': 'Have you already purchased an OPPO smartphone in Austria?',
      'Haben Sie bereits ein OPPO Gerät gekauft?': 'Have you already purchased an OPPO device?',
      'Ja': 'Yes',
      'Nein': 'No',
      'Bestellnummer (optional):': 'Order number (optional):',
      'Bestellnummer (optional)': 'Order number (optional)',
      'Bestätigen Sie die Richtlinien für das österreichische Programm:': 'Please confirm the Austria program terms:',
      'Bitte bestätigen Sie die Teilnahme am OPPO Austria Referral Program:': 'Please confirm participation in the OPPO Austria Referral Program:',
      'Ich akzeptiere die': 'I accept the',
      'Teilnahmebedingungen': 'Terms & Conditions',
      'des OPPO Referral Programms.': 'of the OPPO Referral Program.',
      'des OPPO Empfehlungsprogramms.': 'of the OPPO Referral Program.',
      'Ich habe die': 'I have read the',
      'Datenschutzerklärung': 'Privacy Policy',
      'zur Kenntnis genommen.': '.',
      'Ihr persönlicher Empfehlungscode:': 'Your personal referral code:',
      'Ihr persönlicher Empfehlungscode wird generiert:': 'Your personal referral code will be generated:',
      'Konto erstellen & fortfahren': 'Create account & continue',
      'Konto erstellen & Dashboard öffnen': 'Create account & open dashboard',
      'Erfolgreich kopiert': 'Copied successfully',
      'Noch nicht registriert': 'Not registered yet',
      'Wird generiert': 'Will be generated',
      'Erfolgreich angemeldet.': 'Signed in successfully.',
      'Bitte zuerst Ihre E-Mail eingeben.': 'Please enter your email first.',
      'Magic Link wurde per E-Mail gesendet.': 'Magic link sent by email.',
      'Abgemeldet.': 'Signed out.',
      'Bitte Pflichtfelder vollständig ausfüllen und Teilnahmebedingungen akzeptieren.': 'Please complete all required fields and accept the terms.',
      'Registrierung erstellt. Bitte bestätigen Sie Ihre E-Mail.': 'Registration created. Please confirm your email.',
      'Konto erfolgreich erstellt.': 'Account created successfully.',
      'Kopiert.': 'Copied.',
      'Kopieren nicht möglich.': 'Unable to copy.',
      'Empfehlungslink kopiert.': 'Referral link copied.',
      'QR-Code wird nach der finalen Produktionsfreigabe aktiviert.': 'QR code will be enabled after production approval.',
      'Auszahlung ist in V1 noch nicht aktiviert. Ihr bestätigtes Guthaben bleibt im Konto sichtbar.': 'Payout is not enabled in V1. Your confirmed reward remains visible in your account.',
      'Daten konnten nicht geladen werden.': 'Could not load data.',
      'Anmelden': 'Sign in',
      'Magic Link per E-Mail senden': 'Send magic link by email'
    },
    zh: {
      'Übersicht': '概览',
      'Empfehlungen': '推荐记录',
      'Produkte & Prämien': '产品与奖励',
      'Produkte': '产品',
      'Wissenscenter': '知识中心',
      'Wissen': '知识库',
      'Konto & Auszahlung': '账户与奖励',
      'Konto': '账户',
      'Österreich · AT': '奥地利 · AT',
      'Deutsch (AT)': '德语（奥地利）',
      'English (EU)': '英语（欧洲）',
      '中文': '中文',
      'Registrieren': '注册',
      'Anmelden': '登录',
      'Abmelden': '退出登录',
      'Offizielles OPPO Österreich Empfehlungsprogramm': 'OPPO 奥地利官方推荐计划',
      'OPPO Austria Empfehlungsprogramm': 'OPPO 奥地利推荐计划',
      'Freunde für Flaggschiff-Innovation begeistern.': '把旗舰科技分享给朋友。',
      'Bis zu €100 Prämie je Empfehlung erhalten.': '每次成功推荐最高可获 €100 奖励。',
      'Teilen Sie exklusive Store-Vorteile mit Ihrem persönlichen Referral-Link. Nach erfolgreichem Kauf erhalten Sie Ihr Guthaben unkompliziert per Banküberweisung oder Store-Gutschrift.': '分享你的专属推荐链接。好友完成符合条件的购买后，奖励会进入你的推荐账户。',
      'Jetzt kostenlos registrieren': '免费注册',
      'Jetzt registrieren': '立即注册',
      'Bereits registriert? Anmelden': '已有账户？立即登录',
      'Freunde empfehlen.': '推荐朋友。',
      'Vorteile erhalten.': '获得奖励。',
      'Empfehlen Sie OPPO und profitieren Sie von bis zu €100 Prämie je erfolgreicher Empfehlung.': '推荐 OPPO，每次成功推荐最高可获 €100 奖励。',
      'Schritt 01': '步骤 01',
      'Schritt 02': '步骤 02',
      'Schritt 03': '步骤 03',
      'In 3 einfachen Schritten': '简单 3 步即可完成',
      'Registrieren & Code sichern': '注册并获取推荐码',
      'In unter 2 Minuten teilnehmen. Als verifizierter Besitzer erhalten Sie direkten Zugriff auf Ihren persönlichen Empfehlungscode.': '不到 2 分钟即可加入，并获得个人专属推荐码。',
      'Link oder QR-Code teilen': '分享链接或二维码',
      'Link teilen': '分享链接',
      'Teilen Sie Produktlinks oder Ihren Code direkt per WhatsApp, E-Mail oder QR-Code auf Social Media und im Bekanntenkreis.': '通过 WhatsApp、邮件、二维码或社交媒体分享产品链接和推荐码。',
      'Prämie flexibel auszahlen': '灵活使用奖励',
      'Belohnung erhalten': '获得奖励',
      'Sobald die 30-tägige Widerrufsfrist abgelaufen ist, lassen Sie sich Ihr Guthaben auf Ihr Bankkonto oder als OPPO Gutschein mit +10% Bonus auszahlen.': '满足活动资格条件后，奖励会进入你的推荐账户。',
      'Kostenlos Konto anlegen & persönlichen Code sichern.': '免费创建账户并获得专属推荐码。',
      'Empfehlungslink oder QR-Code an Kontakte senden.': '向朋友发送推荐链接或二维码。',
      'Bis zu €50–€100 Gutschrift nach Gerätekauf erhalten.': '好友完成符合条件的购机后，可获得 €50–€100 推荐奖励。',
      'Direkt als bestehender Kunde einloggen →': '已有账户？直接登录 →',
      'Ihr persönliches OPPO Austria Referral Dashboard mit Echtzeit-Tracking.': '你的 OPPO 奥地利推荐计划个人中心，可实时查看推荐状态。',
      'Ihre Empfehlungen auf einen Blick': '推荐情况一览',
      'Mein QR-Code': '我的二维码',
      'Guthaben auszahlen': '使用奖励',
      'Bereit zur Auszahlung': '可用奖励',
      'Verfügbares Bar-Guthaben': '当前可用奖励',
      'In Prüfung': '审核中',
      'Laufende Widerrufsfrist': '等待资格确认',
      'Erfolgreich weitergeleitet': '成功推荐',
      'Erfolgreich geteilt': '成功推荐',
      'Bestätigte Käufe': '已确认购买',
      'Ausgelieferte Bestellungen': '符合条件的订单',
      'Verkäufe': '成交',
      'Abgeschlossene Käufe': '已完成购买',
      'Ihr persönlicher Empfehlungslink': '你的专属推荐链接',
      'Ihr Empfehlungslink': '你的推荐链接',
      'Freunde sparen bis zu €50 beim Neukauf im offiziellen AT Store': '好友在奥地利官方商城完成符合条件的购买，最高可优惠 €50',
      'Code:': '推荐码：',
      'Link kopieren': '复制链接',
      'Kopieren': '复制',
      'Code kopieren': '复制推荐码',
      'E-Mail': '邮件',
      'QR-Code': '二维码',
      'Letzte Empfehlungsaktivitäten': '最近推荐动态',
      'Letzte Empfehlungen': '最近推荐',
      'Aktuelle Status-Updates von Freunden & Kontakten': '好友与联系人最新推荐状态',
      'Alle anzeigen': '查看全部',
      'Kontakt': '联系人',
      'Gerät': '设备',
      'Datum': '日期',
      'Status': '状态',
      'Prämie': '奖励',
      'Bestätigt': '已确认',
      'Ausstehend': '待处理',
      'Storniert': '已取消',
      'In Prüfung (Widerrufsfrist)': '审核中',
      'Belohnungskonto': '奖励账户',
      'Belohnungsübersicht': '奖励概览',
      'Offizielles Gutschriften-Konto Österreich': 'OPPO 奥地利推荐奖励账户',
      'Aktiv': '有效',
      'Status: Aktiv': '状态：有效',
      'Verfügbar': '可用',
      'Ausbezahlt': '已发放',
      'Genutzt': '已使用',
      'Guthaben jetzt auszahlen lassen': '使用可用奖励',
      'Guthaben verwenden / Auszahlen': '使用奖励',
      'Guthaben verwenden / auszahlen': '使用奖励',
      'Auszahlung direkt auf Ihr IBAN-Konto (AT) innerhalb von 1-2 Werktagen.': 'V1 暂未启用真实提现，符合条件的奖励会保留在账户中。',
      'Referral Mitgliedschaft': '推荐会员等级',
      'Ihr Status': '你的等级',
      'Noch 2 bestätigte Empfehlungen bis zum Status': '距离下一等级还差 2 次成功推荐',
      '8 von 10 Zielen erreicht': '已完成 8 / 10',
      'Widerrufsfrist & Prämien-Freigabe': '资格确认与奖励发放',
      'Prämien werden exakt 30 Tage nach Kaufabschluss des eingeladenen Kunden gutgeschrieben, sofern keine Rücksendung erfolgt.': '推荐购买满足活动资格且未发生影响资格的退货后，奖励会进入可用状态。',
      'Empfehlungen & Historie': '推荐记录与历史',
      'Alle Empfehlungen': '全部推荐',
      'Detaillierte Übersicht über alle über Ihren Link initiierten Käufe.': '查看通过你的推荐链接产生的全部推荐记录。',
      'Vollständige Historie aller weitergeleiteten Käufe': '完整推荐历史',
      'Alle': '全部',
      'Empfohlener Käufer': '被推荐用户',
      'Modell': '型号',
      'Transaktions-ID': '交易编号',
      'Bestelldatum': '订单日期',
      'Ihre Prämie': '你的奖励',
      'Storniert / Widerruf': '已取消 / 已退货',
      'Produkte gezielt empfehlen': '按产品进行推荐',
      'Produkte empfehlen': '推荐产品',
      'Wählen Sie ein bestimmtes Modell aus und teilen Sie maßgeschneiderte Produkt-Links.': '选择具体机型并分享对应的产品推荐链接。',
      'Wählen Sie ein Gerät und teilen Sie den direkten Vorteil': '选择设备并分享对应权益',
      'Flaggschiff': '旗舰',
      'Top Empfehlung': '重点推荐',
      'Top Seller': '畅销推荐',
      'Standard': '标准',
      'Mittelklasse': '中端',
      'Link erstellen & teilen': '生成并分享链接',
      'Empfehlen': '推荐',
      'Ihre Prämie: €50': '你的奖励：€50',
      'Ihre Prämie: €40': '你的奖励：€40',
      'Ihre Prämie: €30': '你的奖励：€30',
      'Wissenscenter & Argumente': '知识中心与推荐话术',
      'Wissen & Verkaufsargumente': '知识库与推荐话术',
      'Antworten auf häufige Fragen und fertige Textbausteine für Freunde.': '常见问题答案与可直接分享给朋友的话术。',
      'Schnelle Antworten und fertige Textbausteine für Freunde': '快速回答与可直接分享的话术',
      'Verkaufsberater Schnell-Antwort': '快速推荐助手',
      'Tippen Sie eine Frage ein, die Ihnen ein Freund gestellt hat:': '输入朋友提出的问题：',
      'Freund fragt nach...': '朋友想了解……',
      'Fragen': '提问',
      'Ergebnis': '回答',
      'Schnell-Antwort': '快速回答',
      'Text kopieren': '复制文案',
      'Antwort kopieren': '复制回答',
      'Warum OPPO?': '为什么选择 OPPO？',
      'Flaggschiff-Erlebnis': '旗舰体验',
      'Warum Find X10 wählen?': '为什么选择 Find X10？',
      'Kamera & Hasselblad': '影像与哈苏',
      'Kamera': '影像',
      'Akku & SUPERVOOC': '电池与 SUPERVOOC',
      'Akku & Laden': '电池与充电',
      '100W Schnellladen': '100W 快充',
      '100W SUPERVOOC Schnellladen': '100W SUPERVOOC 快充',
      'Service Österreich': '奥地利服务',
      'Garantie & Service': '保修与服务',
      'Lokaler Vor-Ort-Support': '本地服务支持',
      'Österreichischer Vor-Ort-Support': '奥地利本地服务支持',
      'Konto & Auszahlungsdaten': '账户与奖励设置',
      'Mein Konto': '我的账户',
      'Verwalten Sie Ihre Bankverbindung und persönlichen Einstellungen.': '管理你的个人账户设置。',
      'Persönliche Daten & Auszahlungspräferenzen': '个人资料与奖励偏好',
      'OPPO Kunde · Verifizierung optional': 'OPPO 用户 · 可选验证',
      'Persönlicher Referral Code': '个人推荐码',
      'Persönlicher Empfehlungscode': '个人推荐码',
      'Auszahlungskonto (IBAN Österreich)': '收款账户（奥地利 IBAN）',
      'Auszahlungsziel (IBAN)': '收款账户（IBAN）',
      'Registrierungsdatum': '注册日期',
      'Registriert seit': '注册时间',
      'Auszahlung beauftragen': '申请奖励发放',
      'Auszahlung anfordern': '申请奖励发放',
      'IBAN ändern': '修改 IBAN',
      'Rechtliche Hinweise & Auszahlungstermine': '活动条款与奖励时间',
      'Programmrichtlinien Österreich': '奥地利活动规则',
      'Produktempfehlung': '产品推荐',
      'Ihre Prämie bei Kaufabschluss:': '资格确认后的奖励：',
      'Direkter Produktlink:': '产品直达链接：',
      'QR-Code vorzeigen': '展示二维码',
      'Vor Ort oder auf mobilen Geräten scannen lassen, um direkt im offiziellen OPPO Österreich Store einzukaufen.': '让朋友扫码进入 OPPO 奥地利官方商城。',
      'Freunde scannen lassen, um direkt im österreichischen OPPO Store zu bestellen.': '让朋友扫码进入 OPPO 奥地利官方商城。',
      'Auszahlungsantrag': '奖励申请',
      'Guthaben transferieren': '使用奖励余额',
      'Guthabenverwaltung': '奖励管理',
      'Aktuell verfügbares Bar-Guthaben:': '当前可用奖励：',
      'Aktuell verfügbar': '当前可用',
      'SEPA Banküberweisung': 'SEPA 银行转账',
      'Überweisung auf Bankkonto': '银行转账',
      'OPPO Store AT Gutschein (+10% Bonus)': 'OPPO Store AT 优惠券（+10% Bonus）',
      'Auszahlung jetzt anfordern': '立即申请',
      'Schritt 1 von 3 · Registrierung': '第 1 / 3 步 · 注册',
      'Schritt 1 von 3 · Konto': '第 1 / 3 步 · 账户',
      'Vorname': '名',
      'Nachname': '姓',
      'E-Mail Adresse': '邮箱地址',
      'Passwort': '密码',
      'Weiter': '下一步',
      'Zurück': '返回',
      'Haben Sie bereits ein OPPO Smartphone in Österreich erworben?': '你是否已经在奥地利购买过 OPPO 手机？',
      'Haben Sie bereits ein OPPO Gerät gekauft?': '你是否已经购买过 OPPO 设备？',
      'Ja': '是',
      'Nein': '否',
      'Bestellnummer (optional):': '订单号（可选）：',
      'Bestellnummer (optional)': '订单号（可选）',
      'Bestätigen Sie die Richtlinien für das österreichische Programm:': '请确认奥地利推荐计划规则：',
      'Bitte bestätigen Sie die Teilnahme am OPPO Austria Referral Program:': '请确认参加 OPPO Austria Referral Program：',
      'Ich akzeptiere die': '我接受',
      'Teilnahmebedingungen': '活动条款',
      'des OPPO Referral Programms.': '。',
      'des OPPO Empfehlungsprogramms.': '。',
      'Ich habe die': '我已阅读',
      'Datenschutzerklärung': '隐私政策',
      'zur Kenntnis genommen.': '。',
      'Ihr persönlicher Empfehlungscode:': '你的个人推荐码：',
      'Ihr persönlicher Empfehlungscode wird generiert:': '系统将生成你的个人推荐码：',
      'Konto erstellen & fortfahren': '创建账户并继续',
      'Konto erstellen & Dashboard öffnen': '创建账户并进入推荐中心',
      'Erfolgreich kopiert': '复制成功',
      'Noch nicht registriert': '尚未注册',
      'Wird generiert': '生成中',
      'Erfolgreich angemeldet.': '登录成功。',
      'Bitte zuerst Ihre E-Mail eingeben.': '请先输入邮箱地址。',
      'Magic Link wurde per E-Mail gesendet.': 'Magic Link 已发送到邮箱。',
      'Abgemeldet.': '已退出登录。',
      'Bitte Pflichtfelder vollständig ausfüllen und Teilnahmebedingungen akzeptieren.': '请填写全部必填项并接受活动条款。',
      'Registrierung erstellt. Bitte bestätigen Sie Ihre E-Mail.': '注册已创建，请确认邮箱。',
      'Konto erfolgreich erstellt.': '账户创建成功。',
      'Kopiert.': '已复制。',
      'Kopieren nicht möglich.': '复制失败。',
      'Empfehlungslink kopiert.': '推荐链接已复制。',
      'QR-Code wird nach der finalen Produktionsfreigabe aktiviert.': '二维码功能将在正式上线后启用。',
      'Auszahlung ist in V1 noch nicht aktiviert. Ihr bestätigtes Guthaben bleibt im Konto sichtbar.': 'V1 暂未启用真实提现，已确认奖励会继续显示在账户中。',
      'Daten konnten nicht geladen werden.': '数据加载失败。',
      'Magic Link per E-Mail senden': '通过邮件发送 Magic Link'
    }
  };

  const placeholderTranslations = {
    en: {
      'z. B. AT-OPPO-892147': 'e.g. AT-OPPO-892147',
      'z. B. Welche Kamera hat das Find X10?': 'e.g. What camera does the Find X10 have?'
    },
    zh: {
      'z. B. AT-OPPO-892147': '例如 AT-OPPO-892147',
      'z. B. Welche Kamera hat das Find X10?': '例如：Find X10 的相机有什么特点？'
    }
  };

  function normalize(lang) {
    const value = String(lang || '').toLowerCase();
    if (value === 'de' || value === 'de-at') return 'de';
    if (value === 'en' || value.startsWith('en-')) return 'en';
    if (value === 'zh' || value.startsWith('zh-') || value === 'cn') return 'zh';
    return 'de';
  }

  function dynamicTranslate(source, lang) {
    if (lang === 'de') return source;
    let m;
    if ((m = source.match(/^Willkommen zurück, (.+)$/))) return lang === 'zh' ? `欢迎回来，${m[1]}` : `Welcome back, ${m[1]}`;
    if ((m = source.match(/^Hallo, (.+)$/))) return lang === 'zh' ? `你好，${m[1]}` : `Hello, ${m[1]}`;
    if ((m = source.match(/^Noch (\d+) bis$/))) return lang === 'zh' ? `还差 ${m[1]} 次` : `${m[1]} more to go`;
    if ((m = source.match(/^(\d+) \/ (\d+) Empfehlungen$/))) return lang === 'zh' ? `${m[1]} / ${m[2]} 次推荐` : `${m[1]} / ${m[2]} referrals`;
    if ((m = source.match(/^(\d+) Empfehlungen$/))) return lang === 'zh' ? `${m[1]} 次推荐` : `${m[1]} referrals`;
    if ((m = source.match(/^Alle \((\d+)\)$/))) return lang === 'zh' ? `全部（${m[1]}）` : `All (${m[1]})`;
    if ((m = source.match(/^Bestätigt \((\d+)\)$/))) return lang === 'zh' ? `已确认（${m[1]}）` : `Qualified (${m[1]})`;
    if ((m = source.match(/^Ausstehend \((\d+)\)$/))) return lang === 'zh' ? `待处理（${m[1]}）` : `Pending (${m[1]})`;
    if ((m = source.match(/^Storniert \((\d+)\)$/))) return lang === 'zh' ? `已取消（${m[1]}）` : `Cancelled (${m[1]})`;
    if ((m = source.match(/^\+(€[\d.,]+) Prämie$/))) return lang === 'zh' ? `奖励 ${m[1]}` : `${m[1]} reward`;
    return source;
  }

  function translateString(source, lang = current) {
    const raw = String(source ?? '');
    if (lang === 'de') return raw;
    return translations[lang]?.[raw] || dynamicTranslate(raw, lang);
  }

  function translateTextNode(node, lang = current) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const raw = node.nodeValue || '';
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!originals.has(node)) originals.set(node, trimmed);
    const source = originals.get(node);
    const translated = translateString(source, lang);
    if (translated === source && lang !== 'de') return;
    const leading = raw.match(/^\s*/)?.[0] || '';
    const trailing = raw.match(/\s*$/)?.[0] || '';
    const rendered = `${leading}${lang === 'de' ? source : translated}${trailing}`;
    lastRendered.set(node, rendered);
    node.nodeValue = rendered;
  }

  function captureAttr(el, attr) {
    let map = attrOriginals.get(el);
    if (!map) { map = {}; attrOriginals.set(el, map); }
    if (!(attr in map)) map[attr] = el.getAttribute(attr);
    return map[attr];
  }

  function translateAttrs(el, lang = current) {
    if (!(el instanceof Element)) return;
    ['placeholder', 'title', 'aria-label'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const source = captureAttr(el, attr);
      if (source == null) return;
      let value = source;
      if (lang !== 'de') {
        value = placeholderTranslations[lang]?.[source] || translations[lang]?.[source] || dynamicTranslate(source, lang);
      }
      el.setAttribute(attr, value);
    });
  }

  function shouldSkip(node) {
    const p = node.parentElement;
    return !p || p.closest('script,style,noscript,svg,code,pre');
  }

  function apply(root = document, lang = current) {
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        if (!shouldSkip(root)) translateTextNode(root, lang);
        return;
      }
      const base = root instanceof Element || root instanceof Document ? root : document;
      if (base instanceof Element) translateAttrs(base, lang);
      base.querySelectorAll?.('*').forEach(el => translateAttrs(el, lang));
      const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!shouldSkip(node)) translateTextNode(node, lang);
      }
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : (lang === 'en' ? 'en' : 'de-AT');
    } finally {
      applying = false;
    }
  }

  function sourceText(el) {
    if (!el) return '';
    const parts = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (shouldSkip(n)) continue;
      parts.push(originals.get(n) || (n.nodeValue || '').trim());
    }
    return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function replaceSource(root, from, to) {
    if (!root || !from || from === to) return false;
    let changed = false;
    applying = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (shouldSkip(node)) continue;
        const currentSource = originals.get(node) || (node.nodeValue || '').trim();
        if (!currentSource || !currentSource.includes(from)) continue;
        const nextSource = currentSource.split(from).join(to);
        originals.set(node, nextSource);
        const raw = node.nodeValue || '';
        const leading = raw.match(/^\s*/)?.[0] || '';
        const trailing = raw.match(/\s*$/)?.[0] || '';
        const rendered = `${leading}${translateString(nextSource, current)}${trailing}`;
        lastRendered.set(node, rendered);
        node.nodeValue = rendered;
        changed = true;
      }
    } finally {
      applying = false;
    }
    return changed;
  }

  function ensureChineseDesktopOption() {
    const menu = document.getElementById('langMenu');
    if (!menu || document.getElementById('langOptionZH')) return;
    const btn = document.createElement('button');
    btn.id = 'langOptionZH';
    btn.className = 'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-surface-card text-brand-gray font-normal';
    btn.onclick = () => setLanguage('zh');
    btn.innerHTML = '<span>中文</span><i id="checkZH" data-lucide="check" class="w-3.5 h-3.5 text-oppo hidden"></i>';
    menu.appendChild(btn);
  }

  function ensureMobileSelector() {
    if (document.getElementById('mobileLanguageSelector') || document.getElementById('langDropdownWrapper')) return;
    const headerRow = document.querySelector('header .max-w-xl > div.flex.items-center.space-x-3');
    if (!headerRow) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'mobileLanguageSelector';
    wrapper.className = 'relative';
    wrapper.innerHTML = `
      <select aria-label="Language" class="text-[10px] font-semibold border border-surface-border rounded-lg bg-white px-2 py-1.5 text-brand-charcoal focus:outline-none focus:border-oppo">
        <option value="de">DE</option>
        <option value="en">EN</option>
        <option value="zh">中文</option>
      </select>`;
    headerRow.insertBefore(wrapper, headerRow.firstChild);
    const select = wrapper.querySelector('select');
    select.value = current;
    select.addEventListener('change', () => setLanguage(select.value));
  }

  function updateControls() {
    const label = document.getElementById('currentLangLabel');
    if (label) label.textContent = current === 'zh' ? '中文' : current.toUpperCase();
    ['DE', 'EN', 'ZH'].forEach(code => {
      const check = document.getElementById(`check${code}`);
      if (check) check.classList.toggle('hidden', code.toLowerCase() !== current);
    });
    const mobile = document.querySelector('#mobileLanguageSelector select');
    if (mobile) mobile.value = current;
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function setLanguage(lang) {
    const next = normalize(lang);
    current = next;
    localStorage.setItem(STORAGE_KEY, next);
    ensureChineseDesktopOption();
    ensureMobileSelector();
    apply(document, next);
    updateControls();
    document.dispatchEvent(new CustomEvent('oppo:languagechange', { detail: { language: next } }));
    const msg = next === 'de' ? 'Sprache auf Deutsch (AT) eingestellt' : next === 'en' ? 'Language switched to English' : '语言已切换为中文';
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  const observer = new MutationObserver(records => {
    if (applying) return;
    for (const record of records) {
      if (record.type === 'characterData') {
        const n = record.target;
        if (!shouldSkip(n)) {
          const rawNow = n.nodeValue || '';
          if (lastRendered.get(n) === rawNow) continue;
          // A business-data update is a new source value; keep it as the source for later language changes.
          const now = rawNow.trim();
          if (now) originals.set(n, now);
          apply(n, current);
        }
      }
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) apply(node, current);
        else if (node.nodeType === Node.ELEMENT_NODE) apply(node, current);
      });
    }
  });

  function init() {
    ensureChineseDesktopOption();
    ensureMobileSelector();
    apply(document, current);
    updateControls();
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  window.ReferralI18n = {
    get language() { return current; },
    locale() { return current === 'zh' ? 'zh-CN' : current === 'en' ? 'en-GB' : 'de-AT'; },
    t: (s) => translateString(s, current),
    translateString,
    setLanguage,
    refresh: () => apply(document, current),
    sourceText,
    replaceSource
  };

  // Replace Stitch's visual-only language function with the real i18n implementation.
  window.selectLanguage = setLanguage;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
