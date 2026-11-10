// ============================================================
// Locket Remote Config Rewrite (Full Gold + Captions + AI Filters)
// Author: TranHai307 (Base config: @duyvinh09)
// ============================================================

var obj = {};
try {
    obj = JSON.parse($response.body || "{}");
} catch (e) {
    obj = {};
}

obj.Attention = "Hệ thống Locket Gold VIP & Photobooth AI - TranHai307";
obj.state = "UPDATE";
obj.entries = obj.entries || {};

// 1. CẤU HÌNH GOLD, FEATURE GATES & PAYWALL
Object.assign(obj.entries, {
    feature_gates: JSON.stringify({
        app_icon_picker: "enabled",
        camera_roll: "enabled",
        camera_theme: "enabled",
        locket_views: "enabled",
        long_captions: "enabled",
        longer_video: "enabled",
        unlimited_friends: "enabled",
        priority_support: "enabled",
        profile_badge: "enabled",
        remove_ads: "enabled",
        video: "enabled",
        custom_widget_frames: "enabled",
        streak_recovery: "enabled"
    }),
    upsell_features: JSON.stringify({
        app_icon_picker: true,
        camera_roll: true,
        camera_theme: true,
        locket_views: true,
        remove_ads: true,
        custom_widget_frames: true
    }),
    paywall_presentation_config: JSON.stringify({
        uid: "paywall_testflight",
        onboarding: false,
        after_sent_moment: false,
        on_foreground: false,
        interval: 2592000,
        profile_banner: true
    }),
    feature_discovery_popup_config: JSON.stringify({
        tag: "LOCKET GOLD",
        tag_gradient: true,
        tag_style: "gold_gradient",
        title: "Lên Locket Gold rồi đó 😎",
        feature_set: [
            {
                title: "Hẹ Hẹ Hẹ ✨",
                body: "TRẦN HẢI NÈ MẤY EM 💛",
                imageURL: "okkkkkk"
            }
        ],
        primary_button_title: "Xong",
        campaign: "locket_gold_tranhai_v4",
        start_at: "2020-01-01T00:00:00",
        end_at: "2099-12-31T23:59:59",
        use_local_time_zone: true
    }),
    android_subscribe_gold_button_enabled: "false",
    profile_badge_visible: "true",
    lunar_new_year_app_icon_enabled: "true"
});

// 2. CHẶN QUẢNG CÁO & TẮT TRACKING (SENTRY)
Object.assign(obj.entries, {
    history_ads_mode: "off",
    history_ads_prefetch_count: "0",
    history_ads_prefetch_immediate: "false",
    history_ads_prefetch_reroute: "false",
    history_ads_dynamic_insertion: "false",
    history_ads_refresh_prefetch_on_foreground: "false",
    history_ads_floor_price: "0",
    history_ads_floor_price_att: "0",
    history_ad_log_displayed_on_background: "false",
    history_ads_debug_menu: "false",
    sentry_sample_rate: "0",
    sentry_network_tracing: "false",
    sentry_performance_tracking: "false",
    sentry_trace_sample_rate: "0",
    sentry_profiles_sample_rate: "0"
});

// 3. CAMERA, VIDEO, PHOTOBOOTH, FILTERS & UPLOAD QUALITY
Object.assign(obj.entries, {
    camera: JSON.stringify({
        gold_max_duration: 60.0,
        goldMaxDuration: 60.0,
        max_duration: 60.0,
        maxDuration: 60.0,
        ultra_wide: true,
        ultraWide: true,
        volume_button: true,
        volumeButton: true,
        flash_button: true,
        telephoto: true,
        srgb: true,
        lanczos: true,
        quality_mbps: 0.6,
        qualityMbps: 0.6
    }),
    camera_roll: JSON.stringify({
        gold_max_duration: 30.0,
        goldMaxDuration: 30.0,
        video_max_duration: 30.0,
        videoMaxDuration: 30.0,
        max_duration: 30.0,
        maxDuration: 30.0,
        trim_max_duration: 30.0,
        trimMaxDuration: 30.0,
        camera_roll_max_duration: 30.0,
        quality_mbps: 0.6,
        qualityMbps: 0.6,
        flash_button: true
    }),
    live_photos: JSON.stringify({
        capture: true,
        video: true,
        viewing: true,
        catch_up: true,
        widget_looping_mode: "never"
    }),
    camera_filter_config: JSON.stringify({
        allows_custom_filters: true,
        show_filter_button: true,
        sheet_enabled: true,
        open_sheet_immediately: true,
        sheet_filters: [
            { title: { en: "📸 Photobooth 4 Ô" }, filter_ids: ["pb_hello_kitty_4cut", "pb_sweet_moments_4cut", "pb_so_fresh_4cut", "pb_diem_thap_4cut", "pb_strawberry", "pb_vintage", "pb_galaxy", "pb_holo_4cut", "pb_scrapbook_ripped_4cut", "pb_ripped_paper_4cut", "pb_denim_ripped_2x2", "photobooth_cute", "photobooth_4cut", "photobooth_film"] },
            { title: { en: "🧧 Photobooth Tết & Noel" }, filter_ids: ["pb_lunar_newyear_4cut", "pb_tet_4cut", "pb_long_phung_1", "pb_long_phung_2", "pb_long_phung_3", "pb_long_phung_5", "pb_long_phung_6", "pb_long_phung_7", "pb_long_phung_9", "pb_xmas_4cut", "pb_xmas_3cut", "pb_xmas_2cut"] },
            { title: { en: "🎀 Khung Đơn Cute & Tết" }, filter_ids: ["khung_tet_mai_vang", "khung_tet_be_ran", "khung_tet_phao_hoa", "khung_tet_lan_su_rong", "khung_tet_be_ran_li_xi", "khung_tet_meo_than_tai", "pb_single_denim_ripped", "pb_single_film_nostalgia", "pb_single_y2k_silver_holo", "cmt_locket", "khung_anh_o_kitty_v_sao", "khung_hello_kitty_h_ng_pastel", "khung_hello_kitty_pastel_ng_t_ng_o", "khung_kh_ng_gian_xanh_pastel", "khung_nh_hoa_pastel_vi_n_xanh_m_nh", "khung_nh_n_pastel_vi_n_ren", "khung_nh_pastel_vi_n_s_h_i_c_u", "khung_nh_shin_chan_vi_n_m_nh", "khung_nh_vu_ng_m_ng_nh_n_b_c", "khung_vu_ng_ng_i_sao_h_ng_pastel", "khung_xanh_v_tay_sao_v_ng", "sinh_nh_t_hello_kitty_ho_i_c", "sticker_b_nh_lu_n_minh_tu"] },
            { title: { en: "✨ Goofy & AI" }, filter_ids: ["okay_wig", "influencer", "looks_maxxing", "toothless", "bye_brows"] },
            { title: { en: "😎 Looks" }, filter_ids: ["bowling_ball", "blonde_bleached", "beard", "bob_cut", "buns", "tatted", "mohawk", "braces"] },
            { title: { en: "🎉 Celebrate & Cute" }, filter_ids: ["slimed", "princess", "disco_lights", "cash_money", "happy_birthday", "cutesy", "sticker_face", "flower_crown", "love_bug"] },
            { title: { en: "🤠 Costumes & Holidays" }, filter_ids: ["wedding", "cowboy_cowgirl", "giraffe", "clown", "easter_bunney_cutout", "easter_chick_cutout", "bearded", "leprechaun", "lucky_face", "sweet_hearts", "elf_cutout", "santa_cutout", "frosty"] }
        ],
        picker_filters: [
            "pb_hello_kitty_4cut", "pb_sweet_moments_4cut", "pb_lunar_newyear_4cut", "pb_tet_4cut", "pb_strawberry", "pb_vintage", "pb_galaxy", "photobooth_4cut",
            "khung_tet_mai_vang", "khung_tet_meo_than_tai", "khung_hello_kitty_h_ng_pastel", "khung_nh_shin_chan_vi_n_m_nh", "pb_single_denim_ripped",
            "okay_wig", "influencer", "looks_maxxing", "toothless", "bye_brows",
            "bowling_ball", "blonde_bleached", "beard", "bob_cut", "buns",
            "tatted", "mohawk", "braces", "slimed", "princess",
            "disco_lights", "cash_money", "happy_birthday", "cutesy", "sticker_face",
            "flower_crown", "love_bug", "wedding", "cowboy_cowgirl", "giraffe",
            "clown", "easter_bunney_cutout", "easter_chick_cutout", "bearded", "leprechaun",
            "lucky_face", "sweet_hearts", "elf_cutout", "santa_cutout", "frosty"
        ]
    }),
    camera_roll_preview_enabled: "true",
    camera_roll_video_enabled: "true",
    camera_roll_video_upload_enabled: "true",
    internal_camera_roll_video_upload_enabled: "true",
    longer_camera_roll_videos_enabled: "true",
    video_sound_enabled: "true",
    microphone_enabled: "true",
    camera_microphone_enabled: "true",
    audio_session_deactivation_enabled: "true",
    zoom_enabled: "true",
    upload_main: "false",
    upload_main_image_quality: "0.6",
    upload_main_image_size: "1440",
    upload_thumbnail_image_quality: "0.8",
    upload_thumbnail_image_size: "1020"
});

// 4. BẠN BÈ, GIỚI HẠN & ĐỀ XUẤT KẾT BẠN
Object.assign(obj.entries, {
    max_friends_count: "999999999",
    friend_limit_mode: "0",
    soft_friend_limit_threshold_count: "999999999",
    show_friend_limit_on_cam: "false",
    signup_max_friends_count: "999999999",
    celebrity_inbox_limit: "999999999",
    celebrity_inbox_enabled: "true",
    celebrity_vip_qr_redemption_enabled: "true",
    friend_limit_geo_override: JSON.stringify({ experiments: {}, area_code_overrides: {} }),
    friends_sheet_locket_count_config: JSON.stringify({ items: [ { threshold: 0, icon_name: "heart" }, { threshold: 1, icon_name: "heart.fill" }, { threshold: 10, emoji: "🤍" }, { threshold: 100, emoji: "💛" }, { threshold: 500, emoji: "❤️‍🔥" }, { threshold: 1000, emoji: "🌟🫶🌟" }, { threshold: 2000, emoji: "✨💟✨" }, { threshold: 5000, emoji: "⚡️😵‍💫⚡" }, { threshold: 10000, emoji: "✨⚡️😱⚡✨" } ]}),
    friend_locket_count_config: JSON.stringify({ items: [ { threshold: 0, icon_name: "heart" }, { threshold: 1, icon_name: "heart.fill" }, { threshold: 10, emoji: "🤍" }, { threshold: 100, emoji: "💛" }, { threshold: 500, emoji: "❤️‍🔥" }, { threshold: 1000, emoji: "✨💗✨" }, { threshold: 2000, emoji: "✨️⭐️✨" }, { threshold: 5000, emoji: "✨💎✨" }, { threshold: 10000, emoji: "✨🔐💛✨" } ]}),
    new_friends_monitoring_enabled: "true",
    improved_friend_suggestions: "true",
    show_friend_suggestions_by_default: "true",
    emoji_friend_suggestions: "true",
    prompt_contact_permissions_on_search: "true",
    populate_phone_numbers_from_suggest_friends: "true",
    hide_friends_enabled: "true",
    hide_invite_links: "false",
    hide_skip_contacts: "true",
    show_all_contacts: "true",
    show_invite_suggestions: "true",
    show_no_friends_bottom_sheet: "false",
    signup_allow_skip_add_friends: "true",
    signup_custom_profile_picture: "true",
    user_data_export_enabled: "true",
    username_suggestions_enabled: "true"
});

// 5. MOMENTS, STREAK, CHAT & TƯƠNG TÁC
try {
    var streak = JSON.parse(obj.entries.streak_config || "{}");
    streak.minimum_recovery_count = 0;
    streak.minimum_display_count = 0;
    obj.entries.streak_config = JSON.stringify(streak);
} catch (e) {}

Object.assign(obj.entries, {
    moment_views_enabled: "true",
    moment_views_v2: "true",
    record_moment_views: "true",
    notify_moment_views: "true",
    get_moment_views_as_cloud_function: "true",
    moment_reactions_v2: "true",
    chat_reactions_enabled: "true",
    conversation_reactions: "true",
    typing_indicators_enabled: "true",
    unsend_message_enabled: "true",
    reply_prototype_enabled: "true",
    messages_integration: "true",
    conversations_enabled: "true",
    fetch_moments_in_conversation: "true",
    hide_chat_button: "false",
    groups_enabled: "true",
    group_contact_invites_enabled: "true",
    groups_onboarding_accept_invite_preview_enabled: "true",
    chat_hyperlink_enabled_mode: "always_enabled",
    send_to_self_only_mode: "always_enabled",
    time_travel_rewind_v2_enabled: "true",
    conversation_drafts_enabled: "true",
    calendar_delete_moment_enabled: "true",
    calendar_rewind_enabled: "false",
    locket_yearbook_story_sharing_encouraged: "true",
    rollcall_enabled: "true",
    rollcall_comment_actions: "true",
    rollcall_profile_button: "true",
    rollcall_prompt_export_after_share: "true",
    rollcall_confirm_skip_tagging: "false",
    rollcall_tap_to_tag_enabled: "false"
});

// 6. WIDGET, THÔNG BÁO & GIAO DIỆN
Object.assign(obj.entries, {
    widget_frame_event_max_images: "5",
    android_widget_frame_event_enabled: "true",
    widget_badge_enabled: "true",
    widget_badge_v2: "true",
    widget_stale_state_enabled: "false",
    widget_last_sent_indicator: "false",
    widget_sync_token_reload_mode: "clearTokenNever",
    widget_frame_event: JSON.stringify({
        uid: "midautumn_2026",
        url: "https://i.ibb.co/1Yt1Dzzy/Shin-chan-1.png",
        use_local_time_zone: true,
        placement: "below",
        start_at: "2020-01-01T00:00:00",
        end_at: "2099-12-31T23:59:59"
    }),
    live_activity_onboarding: "true",
    live_activity_onboarding_variant: "friending",
    register_live_activity_push_to_start_token: "true",
    live_activity_remove_stale_start_token: "true",
    notification_preferences_live_activities: "true",
    notification_preferences: "true",
    notification_reply_body_visible: "true",
    prompt_notification_permissions_after_friending: "true",
    activity_bar_enabled: "true",
    journal_activity_bar_enabled: "true",
    journal_settings: JSON.stringify({
        debug_menu_enabled: false,
        focus_animation: false,
        compact_header: true,
        friends_button: false,
        reverse_scroll_direction: false,
        streak_visualization: true,
        streak_visualization_style: "gradient",
        streak_header_minimum_count: 0,
        streak_visualization_minimum_count: 2,
        overlay_indicators: { location: false, music: true, static_content: true, weather: true }
    }),
    qr_code_config: JSON.stringify({ profile_enabled: true, scanning_enabled: true }),
    custom_profile_pics: "true",
    profile_menu_v2_enabled: "true"
});

// 7. HỆ THỐNG, CACHE & STORAGE CDN
Object.assign(obj.entries, {
    cdn_domain_replacements: JSON.stringify({ "firebasestorage.googleapis.com": "cdn.locketcamera.com" }),
    cdn_domain_replacements_video: "true",
    storage_bucket: "gs://locket-img",
    storage_bucket_video: "gs://locket-video",
    image_cache_max_age_sec: "157680000",
    image_cache_max_size: "400000000",
    history_cache_age_days: "1000",
    user_cache_max_age_sec: "691200",
    friends_cache_max_age_sec: "2592000",
    image_fetch_cache: "true",
    image_cache_use_shared: "true",
    use_doc_dir_for_image_cache: "true",
    efficient_history_cache_invalidation: "true",
    timestamp_based_history_fetches: "true",
    get_latest_moment_v2: "true",
    fetch_users_from_cloud_function: "true",
    refresh_interval: "60",
    firestore_refresh_v2: "true",
    firestore_refresh_v3: "true",
    keychain_access_retries: "true",
    blocked_users_cached_sync_enabled: "true",
    beta_features_enabled: "true",
    join_testflight_enabled: "true",
    safety_center: "true",
    help_center: "true",
    support_v2: "true",
    privacy_choices_setting: "true",
    request_att_permission: "true",
    invite_link_preview_variant: "4",
    share_history_config: JSON.stringify({ prompt_enabled: false, fetching_enabled: true }),
    share_history_prompt_enabled: "false",
    use_thumbnails_for_sharing: "true",
    use_thumbnails_in_timeline: "true",
    persist_onboarding_step: "true",
    onboarding_contact_permission_step: "true"
});

// 8. OVERLAY & CUSTOM CAPTIONS
Object.assign(obj.entries, {
    overlay_navigator_enabled: "true",
    overlays_v2_config: JSON.stringify({ suggestions_enabled: true }),
    captions_enabled: "true",
    music_caption_enabled: "true",
    music_caption_song_preview_enabled: "true",
    link_caption_link_enabled: "true",
    overlay_dynamic_captions: JSON.stringify([
        "standard", "poll", "color_palette", "review", "music", "location",
        "weather", "time", "streak", "star_sign", "party_time", "locket_count",
        "good_morning", "goodnight", "ootd", "miss_you", "custom", "halloween_2026"
    ]),
    overlay_items: JSON.stringify([
        {
            section: "🎨 General",
            items: [
                { overlay_id: "caption:standard", source: "local", caption: { type: "standard" } },
                { overlay_id: "caption:link", source: "local", caption: { type: "link" }, overlay_type: "caption" },
                { overlay_id: "caption:review", source: "local", caption: { type: "review" } },
                { overlay_id: "caption:poll", source: "local", caption: { type: "poll" } },
                { overlay_id: "caption:music", source: "local", caption: { type: "music" } },
                { overlay_id: "caption:location", source: "local", caption: { type: "location" } },
                { overlay_id: "caption:weather", source: "local", caption: { type: "weather" } },
                { overlay_id: "caption:time", source: "local", caption: { type: "time" } },
                { overlay_id: "caption:streak", source: "local", caption: { type: "streak" } },
                { overlay_id: "caption:star_sign", source: "local", caption: { type: "star_sign" } },
                { overlay_id: "caption:color_palette", source: "local", caption: { type: "color_palette" } },
                { overlay_id: "caption:live", source: "local", caption: { type: "live" } },
                { overlay_id: "caption:locket_count", source: "local", caption: { type: "locket_count" } }
            ]
        },
        {
            section: "🎨 Holiday & Decorative",
            items: [
                { overlay_id: "caption:halloween_2026", source: "remote", caption: { background: { colors: ["#150804", "#C8540D"] }, icon: { data: "🎃", type: "emoji" }, max_lines: 1, text: "Halloween", localized_text: { en: "Halloween", vn: "Halloween" }, text_color: "#FFB182", type: "static_content" } },
                { overlay_id: "caption:christmas_day_2026", source: "remote", caption: { background: { colors: ["#E53935", "#A81818"] }, icon: { data: "🎄", type: "emoji" }, max_lines: 1, text: "Giáng sinh an lành", localized_text: { en: "Giáng sinh an lành", vn: "Giáng sinh an lành" }, text_color: "#FFFFFF", type: "static_content" } },
                { overlay_id: "caption:new_years_day_2027", source: "remote", caption: { background: { colors: ["#3B00EC", "#823FFF"] }, icon: { data: "💫", type: "emoji" }, max_lines: 1, text: "Xin chào 2027!", localized_text: { en: "Xin chào 2027!", vn: "Xin chào 2027!" }, text_color: "#FFFFFF", type: "static_content" } },
                { overlay_id: "caption:party_time", source: "remote", caption: { background: { colors: ["#5EFFF5", "#FCFF57"] }, icon: { data: "🪩", type: "emoji" }, max_lines: 1, text: "Party Time!", text_color: "#000000E6", type: "static_content" } },
                { overlay_id: "caption:good_morning", source: "remote", daily_start_hour: 5, daily_end_hour: 10, caption: { background: { colors: ["#EF7402", "#EABF0F"] }, icon: { data: "☀️", type: "emoji" }, max_lines: 1, text: "Good morning", text_color: "#FFFFFFE5", type: "static_content" } },
                { overlay_id: "caption:goodnight", source: "remote", daily_start_hour: 19.5, daily_end_hour: 24, caption: { background: { colors: ["#370C6F", "#575CD4"] }, icon: { data: "🌙", type: "emoji" }, max_lines: 1, text: "Goodnight", text_color: "#FFFFFFE6", type: "static_content" } },
                { overlay_id: "caption:miss_you", source: "remote", caption: { background: { colors: ["#EC0C00", "#FF493F"] }, icon: { data: "🥰", type: "emoji" }, max_lines: 1, text: "Miss you", text_color: "#FFFFFFDB", type: "static_content" } },
                { overlay_id: "caption:ootd", source: "remote", caption: { background: { colors: ["#FFFFFF", "#DBDBDB"] }, icon: { data: "🕶", type: "emoji" }, max_lines: 1, text: "OOTD", text_color: "#101010E6", type: "static_content" } }
            ]
        },
        {
            section: "🎨 Tình yêu & Gen Z 💕💅",
            items: [
                { overlay_id: "caption:em_nho_anhh", source: "remote", caption: { background: { colors: ["#FF6B81", "#FF8E9E", "#FFB3C6"] }, icon: { data: "🥺", type: "emoji" }, max_lines: 1, text: "em nhớ anhh", text_color: "#8C1938", type: "static_content" } },
                { overlay_id: "caption:i_love_you", source: "remote", caption: { background: { colors: ["#FF8FAB", "#FFC2D1", "#FFE5EC"] }, icon: { data: "💗", type: "emoji" }, max_lines: 1, text: "i love you", text_color: "#8A304F", type: "static_content" } },
                { overlay_id: "caption:muon_duoc_om", source: "remote", caption: { background: { colors: ["#FF9A9E", "#FECFEF"] }, icon: { data: "🫂", type: "emoji" }, max_lines: 1, text: "Muốn được ôm", text_color: "#FFFFFF", type: "static_content" } },
                { overlay_id: "caption:ngoan_xinh_iu", source: "remote", caption: { background: { colors: ["#F3C1D4", "#F8DDE5", "#E8CFF0"] }, icon: { data: "💗", type: "emoji" }, max_lines: 1, text: "ngoan xinh iu của ai đây", text_color: "#71465D", type: "static_content" } },
                { overlay_id: "caption:hom_nay_slay", source: "remote", caption: { background: { colors: ["#C5B5E8", "#DDD0F2", "#F0C9DD"] }, icon: { data: "✨", type: "emoji" }, max_lines: 1, text: "hôm nay cũng slay", text_color: "#514368", type: "static_content" } },
                { overlay_id: "caption:dep_trai_co_gi_sai", source: "remote", caption: { background: { colors: ["#FF5722", "#FFC107"] }, icon: { data: "😎", type: "emoji" }, max_lines: 1, text: "Đẹp trai có gì sai", text_color: "#000000E6", type: "static_content" } },
                { overlay_id: "caption:oach_xa_lach", source: "remote", caption: { background: { colors: ["#11998E", "#38EF7D"] }, icon: { data: "🥬", type: "emoji" }, max_lines: 1, text: "oách xà lách", text_color: "#FFFFFF", type: "static_content" } },
                { overlay_id: "caption:overthinking_vai_chuong", source: "remote", caption: { background: { colors: ["#2C3E50", "#4CA1AF"] }, icon: { data: "🤯", type: "emoji" }, max_lines: 1, text: "Overthinking vai chưởng", text_color: "#FFFFFFE6", type: "static_content" } },
                { overlay_id: "caption:deadline_ruot", source: "remote", caption: { background: { colors: ["#ED213A", "#93291E"] }, icon: { data: "🔥", type: "emoji" }, max_lines: 1, text: "Deadline dí tụt quần", text_color: "#FFFFFFE6", type: "static_content" } },
                { overlay_id: "caption:tuyet_doi_dien_anh", source: "remote", caption: { background: { colors: ["#455A64", "#263238"] }, icon: { data: "📷", type: "emoji" }, max_lines: 1, text: "Tuyệt đối điện ảnh", text_color: "#FFFFFFE6", type: "static_content" } }
            ]
        }
    ])
});

$done({ body: JSON.stringify(obj) });
