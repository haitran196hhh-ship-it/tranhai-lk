const fs = require('fs');
const path = require('path');

function buildPrompt(title, details, constraint) {
  return `Show the persons in the photo with the exact same pose and background, but with ${title}, captured with a modern iPhone camera look.\n\n` +
    `${details}\n\n` +
    `All enhancements and additions should remain confined strictly to ${constraint}. Do not alter the overall head size, face shape, facial features, eyes, smile, expression, or identity. Preserve natural skin texture, pores, and lighting so the elements integrate realistically with the environment.\n\n` +
    `Apply modern iPhone camera characteristics across the entire image: natural HDR, crisp facial detail, balanced highlights and shadows, and slightly vibrant but realistic colors. The additions should inherit this same processing so they feel captured in-camera.\n\n` +
    `Keep the background, pose, framing, depth of field, and image quality exactly the same. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;
}

const MASTER_PROMPTS = {};

// 1. Cash / Tiền đô
MASTER_PROMPTS['stk_dio_cash'] = buildPrompt(
  'crisp US dollar bills floating, raining down, and scattering dynamically across the scene and surroundings',
  'Add numerous detailed hundred-dollar bills floating mid-air at varied depths, orientations, and distances from the camera. Some bills appear closer with subtle depth-of-field softness, while others appear crisp and sharp near the subject. The bills should interact naturally with the scene lighting, showing realistic paper sheen, faint creases, and casting gentle translucent contact shadows where they pass near surfaces.',
  'the floating currency notes and ambient paper reflections'
);

// 2. Disco
MASTER_PROMPTS['stk_dio_disco'] = `Show the persons in the photo with the exact same pose and background, but with disco-style lighting effects cast across the scene, captured with a modern iPhone camera look.

Add dynamic, multicolored disco light patterns projected onto the subject and background, including soft circular light spots and scattered beams in colors like red, blue, green, and purple. The lights should appear as if coming from an off-camera rotating disco ball or party light, with varying intensity and size across the frame.

Ensure the light spots wrap naturally over the contours of the face, clothing, and environment, slightly warping with surface curvature. Some lights can appear sharper while others are softly diffused depending on depth of field and distance. Include subtle motion blur or variation in brightness to suggest movement without overwhelming the image.

The lighting should interact realistically with the existing scene, blending with the original light sources rather than replacing them. Maintain proper shadow behavior and avoid flattening the subject.

Apply modern iPhone camera characteristics across the entire image: natural HDR, crisp subject detail, balanced highlights and shadows, and slightly vibrant but realistic colors. The disco lights should inherit this same processing so they feel captured in-camera.

Do not alter the person’s face, expression, identity, or pose. Keep the background, framing, depth of field, and image quality exactly the same, with the lighting effect appearing as a natural part of the scene. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;

// 3. Influencer
MASTER_PROMPTS['stk_dio_influencer'] = `Show the persons in the photo with the exact same pose and background, but with a hyperbolic "influencer" makeup look applied to the face, captured with a modern iPhone camera look.

Enhance the eyebrows so they appear highly sculpted and precisely shaped, with sharp definition and fuller density while preserving the original eyebrow placement and bone structure. The brows should have clean edges, slightly darker pigment, and visible individual hair strokes so they look groomed rather than painted.

Add long, dramatic fake eyelashes that extend outward and upward from the natural lash line. The lashes should appear thick and layered with subtle tapering at the ends, curving naturally with the eyelid and casting faint shadows onto the upper cheek area.

Enhance the lips with a glossy finish and visibly enlarged lip volume, resembling cosmetic lip injections. The lips should appear fuller and more plump while maintaining the person's original lip shape and proportions. Add natural specular highlights and reflective gloss texture across the surface to create a shiny appearance, with slight light reflections consistent with the scene.

All enhancements should remain confined strictly to the facial features. Do not alter the overall head size, face shape, or identity. Preserve natural skin texture, pores, and lighting so the makeup integrates realistically with the environment.

Apply modern iPhone camera characteristics across the entire image: natural HDR, crisp facial detail, balanced highlights and shadows, and slightly vibrant but realistic colors. The enhancements should inherit this same processing so they feel captured in-camera.

Keep the background, pose, framing, depth of field, and image quality exactly the same. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;

// 4. Gold Crown
MASTER_PROMPTS['stk_gold_crown'] = buildPrompt(
  'an ornate gleaming gold royal crown studded with ruby and emerald gemstones resting naturally on top of the head',
  'Generate an exquisite metallic royal crown made of polished yellow gold with ornate filigree arches, encrusted with brilliant red rubies and emerald green gemstones. The crown should rest comfortably and naturally on top of the head, conforming to the head curvature and hairstyle, casting soft contact shadows onto the hair beneath. The polished gold surface should catch realistic specular highlights from the ambient scene light.',
  'the royal crown accessory resting on top of the head'
);

// 5. Sweet Valentine
MASTER_PROMPTS['stk_sweet_valentine'] = buildPrompt(
  'romantic glowing translucent pink hearts and gentle heart-shaped bokeh floating gracefully throughout the scene',
  'Add ethereal, semi-translucent glowing soft pink hearts floating gently in the air at various depths and sizes. Soft heart-shaped bokeh light orbs drift peacefully around the surroundings. Add a delicate, flattering warm soft pink cheek glow on the subject, perfectly blended into the natural skin tones with warm romantic ambient lighting.',
  'the floating hearts, bokeh lighting, and subtle cheek warmth'
);

// 6. Christmas Bell
MASTER_PROMPTS['stk_christmas_bell'] = buildPrompt(
  'warm twinkling Christmas fairy lights, festive pine boughs, and holly berry accents throughout the surroundings',
  'Decorate the surrounding background with warm golden fairy light strings twinkling softly with shallow depth of field. Fresh green pine needles and vibrant red holly berry sprigs frame the outer edges of the scene. Subtle warm golden light glints cast a cozy holiday glow across the clothing and atmosphere.',
  'the festive Christmas foliage, fairy lights, and holiday sparkles'
);

// 7. Tet Mai
MASTER_PROMPTS['stk_tet_mai'] = buildPrompt(
  'vibrant blooming yellow apricot blossom branches (hoa mai), golden sparkles, and floating red lucky money envelopes (li xi)',
  'Add elegant branches of blooming golden yellow apricot blossoms (hoa mai) framing the background and scene edges. Crisp red Vietnamese lucky money envelopes with gold calligraphy drift gently in the air with festive golden sparkles. Warm festive ambient light enhances the celebratory springtime atmosphere.',
  'the floral branches, floating envelopes, and golden festive atmosphere'
);

// 8. Halloween Pumpkin
MASTER_PROMPTS['stk_halloween_pumpkin'] = buildPrompt(
  'glowing carved jack-o-lantern pumpkins placed naturally in the scene with warm flickering candlelight accents',
  'Place finely carved festive pumpkins with glowing carved faces naturally in the environment near the subject. Warm flickering orange candlelight spills from within the pumpkins, casting gentle warm amber rim highlights onto nearby surfaces and clothing. Crisp autumn leaves scatter softly around the base.',
  'the pumpkins, candlelight illumination, and autumn leaves'
);

// 9. Mid-Autumn Rabbit
MASTER_PROMPTS['stk_midautumn_rabbit'] = buildPrompt(
  'a luminous golden full moon glow, gentle celestial sparkles, and glowing Mid-Autumn star lanterns (den ong sao)',
  'Introduce a warm radiant full moon glow illuminating the upper background. Traditional colorful cellophane Mid-Autumn star lanterns (den ong sao) glow softly with warm internal candle glow, accompanied by gentle golden celestial sparkles and starry dust floating peacefully through the night air.',
  'the celestial moon glow, lanterns, and starry sparkles'
);

// 10. Dio PM2
MASTER_PROMPTS['stk_dio_pm2'] = buildPrompt(
  'a magical mystical aura with glowing purple and gold sparkles and drifting candle-lit arcane shimmer',
  'Surround the scene with an enchanting fantasy aura composed of luminous violet, magenta, and warm gold particles. Delicate arcane light wisps and ember-like floating motes drift smoothly around the subject, creating a captivating mystical energy field that reflects softly against clothing.',
  'the glowing aura, arcane shimmer, and floating particles'
);

// 11. Looksmaxing
MASTER_PROMPTS['stk_dio_looksmaxing'] = `Show the persons in the photo with the exact same pose and background, but with professional high-end studio portrait lighting applied to the scene, captured with a modern iPhone camera look.

Elevate the illumination with flattering softbox key lighting that gently highlights facial contours, creates crisp circular catchlights in the eyes, and brings out clear, radiant, glowing skin texture with natural depth of field.

All enhancements should remain confined strictly to lighting, skin clarity, and specular highlights. Do not alter the head size, bone structure, face shape, eyes, smile, expression, identity, or hairstyle. Preserve natural skin texture, pores, and features so the portrait feels genuinely captured in a professional photo studio.

Apply modern iPhone camera characteristics across the entire image: natural HDR, crisp facial detail, balanced highlights and shadows, and true-to-life colors.

Keep the background, pose, framing, depth of field, and image quality exactly the same. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;

// 12. Toothless
MASTER_PROMPTS['stk_dio_toothless'] = buildPrompt(
  'a playful funny sticker effect with a goofy cartoon smile mouth overlay and cartoon starry sparkles',
  'Overlay a fun, bright white goofy cartoon smile mouth sticker graphic over the mouth area, accompanied by colorful cartoon star sparkles and playful hand-drawn doodle accents on the cheeks, styled like a trendy digital sticker overlay.',
  'the cartoon sticker mouth overlay and cheek doodle sparkles'
);

// 13. Orange Wig
MASTER_PROMPTS['stk_dio_orange_wig'] = buildPrompt(
  'a glossy bright yellow-orange chin-length bob wig with neat blunt bangs',
  'Style the hair with a chic, vibrant sunflower-orange synthetic wig cut into a clean chin-length bob with precision-cut blunt bangs across the forehead. The wig sits naturally on the scalp, following the true head contours with realistic hair sheen and fine fiber separation without expanding head silhouette.',
  'the wig hair piece resting on the head'
);

// 14. Bye Brows
MASTER_PROMPTS['stk_dio_bye_brows'] = buildPrompt(
  'a sleek bleached-eyebrow look where the eyebrows are lightened to match skin tone',
  'Lighten the eyebrow hair to a soft pale platinum tone that blends seamlessly with the natural forehead skin tone, creating a high-fashion bleached eyebrow aesthetic while preserving brow bone ridge and natural skin texture.',
  'the eyebrow color modification only'
);

// 15. Braces
MASTER_PROMPTS['stk_dio_braces'] = buildPrompt(
  'classic shiny metal dental braces with small colorful elastic brackets onto the teeth',
  'If teeth are visible, add detailed miniature metallic orthodontic brackets connected by a thin shiny archwire across the teeth, with playful multicolored rubber ligatures. If teeth are not visible, preserve the smile exactly while adding subtle metallic braces glint.',
  'the dental braces brackets and archwire'
);

// 16. Tatted
MASTER_PROMPTS['stk_dio_tatted'] = buildPrompt(
  'fun colorful festival face-paint decals and playful decorative doodles on the cheeks',
  'Add charming miniature temporary festival tattoos on the cheeks and temple: cute small stars, musical notes, crescent moons, and pastel doodles with clean sticker edges that conform naturally to facial curvature and pores.',
  'the temporary festival tattoo decals on the face'
);

// 17. Bearded
MASTER_PROMPTS['stk_dio_bearded'] = buildPrompt(
  'a fun theatrical novelty costume prop beard and mustache in a playful dress-up style',
  'Place a full theatrical costume novelty beard and matching handlebar mustache naturally over the lower face. The prop hair shows realistic strand density, natural undertones, and sits cleanly without distorting face shape or jaw structure.',
  'the costume novelty beard accessory'
);

// 18. Buns
MASTER_PROMPTS['stk_dio_buns'] = buildPrompt(
  'two cute voluminous high space buns hair extension on top of the head',
  'Style the hair with two neat, rounded high space buns positioned symmetrically on the crown of the head. The buns show natural hair texture, fine woven strands, and soft natural flyaways matching the person\'s natural hair undertone.',
  'the space buns hair pieces on top of the head'
);

// 19. Mohawk
MASTER_PROMPTS['stk_dio_mohawk'] = buildPrompt(
  'a bold spiked punk mohawk haircut style along the center of the head',
  'Style the central strip of hair upward into a structured, textured punk mohawk with natural separation, while the sides are neatly tapered close to the scalp, preserving true head shape and cranial silhouette.',
  'the styled center mohawk hair formation'
);

// 20. Bob
MASTER_PROMPTS['stk_dio_bob'] = buildPrompt(
  'a chic glossy chestnut-brown chin-length wavy bob haircut',
  'Style the hair into an elegant chin-length bob with soft, natural beach waves and healthy shine. The hair frames the face naturally, curving slightly inward at the jawline while preserving the natural hairline.',
  'the wavy bob hairstyle shaping'
);

// 21. Bowling Ball (Bald)
MASTER_PROMPTS['stk_dio_bowling_ball'] = buildPrompt(
  'a clean-shaven smooth bald head appearance',
  'Render the scalp cleanly shaven and bald, showing realistic scalp skin texture, subtle natural sheen following scene lighting, and true cranial curvature without altering facial features, eyebrows, or head size.',
  'the scalp hair removal only'
);

// 22. Bleached Hair
MASTER_PROMPTS['stk_dio_bleached_hair'] = buildPrompt(
  'a modern textured platinum-blonde bleached hair color',
  'Transform only the hair color into a cool platinum-blonde tone with subtle warm undertones and natural root depth. Preserve the original hair length, curl pattern, and texture completely.',
  'the hair coloration only'
);

// 23. Princess Tiara
MASTER_PROMPTS['stk_dio_princess'] = buildPrompt(
  'a sparkling silver royal tiara adorned with pink heart gemstones on top of the head',
  'Place a graceful polished sterling silver tiara on the crown of the head, embellished with delicate heart-cut pink crystals and glittering pavé stones that catch realistic ambient light reflections.',
  'the silver tiara accessory'
);

// 24. Slimed
MASTER_PROMPTS['stk_dio_slimed'] = buildPrompt(
  'bright neon-green gooey slime playfully dripping and splashing over the top surfaces of the scene',
  'Add glossy, translucent neon-green slime splashing and dripping playfully from the upper edges of the scene. Slime strands form viscous drips and puddles on horizontal surfaces with bright specular highlights and jelly-like transparency.',
  'the decorative green slime liquid elements'
);

// 25. Happy Birthday
MASTER_PROMPTS['stk_dio_happy_birthday'] = buildPrompt(
  'a joyful celebratory explosion of colorful rainbow party confetti and flying serpentine streamers',
  'Fill the surrounding air with vibrant multicolored party confetti dots, swirling holographic serpentine ribbons, and celebratory party sparkles floating dynamically at varied depths around the subject.',
  'the celebratory party confetti and streamers'
);

// 26. Flower Crown
MASTER_PROMPTS['stk_dio_flower_crown'] = buildPrompt(
  'a delicate floral crown woven with pastel pink and white roses and green leaves on top of the head',
  'Place a charming handcrafted flower wreath composed of soft pastel garden roses, baby\'s breath florets, and eucalyptus leaves resting gently on top of the hair, casting subtle natural shadows onto hair strands.',
  'the floral head wreath accessory'
);

// 27. Cutesy
MASTER_PROMPTS['stk_dio_cutesy'] = buildPrompt(
  'a cute playful photo filter effect with pastel pink cheek blush and tiny subtle heart sparkles',
  'Add soft pastel peach-pink cheek blush, subtle shimmering skin highlights, and miniature glittering heart sparkles near the cheekbones, complemented by bright, flattering selfie illumination.',
  'the blush makeup and delicate heart sparkles'
);

// 28. Sticker Face
MASTER_PROMPTS['stk_dio_sticker_face'] = buildPrompt(
  'cute decorative pastel glitter heart stickers on the cheeks (in purple, pink, and yellow)',
  'Apply glossy miniature heart decal stickers in lavender, pastel pink, and lemon yellow on the upper cheeks, showing crisp sticker borders, subtle glitter texture, and natural adhesive contact shadows.',
  'the decorative heart cheek stickers'
);

// 29. Love Bug
MASTER_PROMPTS['stk_dio_love_bug'] = buildPrompt(
  'a cute novelty headband with two springy yellow heart-shaped antennae on top of the head',
  'Place a slender black novelty headband with two coiled metal springs topped with plush bright yellow hearts bobbing playfully above the head, catching soft highlights consistent with scene light.',
  'the love bug headband accessory'
);

// 30. Cowboy
MASTER_PROMPTS['stk_dio_cowboy'] = buildPrompt(
  'a brown leather cowboy hat on the head and a cow-print bandana neckerchief around the neck',
  'Place a classic structured brown leather western cowboy hat with a curved brim on top of the head, paired with a stylish folded cow-pattern bandana tied neatly around the neck collar.',
  'the cowboy hat and bandana neckerchief'
);

// 31. Giraffe
MASTER_PROMPTS['stk_dio_giraffe'] = buildPrompt(
  'a cute plush giraffe costume hood with spotted print, soft ears, and small horns framing the face',
  'Frame the head with a cozy plush giraffe onesie hood made of warm tan fabric with brown patches, featuring two soft rounded ears and cute miniature horns on top while leaving the full face completely open and visible.',
  'the giraffe plush hood costume accessory'
);

// 32. Wedding
MASTER_PROMPTS['stk_dio_wedding'] = buildPrompt(
  'celebratory formal gala attire with an elegant white satin hair ribbon and a flower boutonniere on the collar',
  'Add a luxurious ivory satin ribbon bow in the hair and pin a fresh white rose boutonniere with baby\'s breath onto the lapel/collar, creating an elegant celebratory wedding celebration look.',
  'the satin ribbon and floral boutonniere'
);

// 33. Clown
MASTER_PROMPTS['stk_dio_clown'] = buildPrompt(
  'a colorful curly clown wig and a playful red clown nose on the face',
  'Place a bouncy multicolored afro clown wig with bright red, blue, and yellow curls on the head, paired with a classic round cherry-red novelty foam clown nose resting gently on the nose tip.',
  'the clown wig and novelty red nose'
);

// 34. Sweet Hearts
MASTER_PROMPTS['stk_dio_sweat_hearts'] = buildPrompt(
  'colorful pastel candy conversation hearts stamped with sweet words floating gently through the air',
  'Add charming chalky pastel heart candies in mint, baby blue, pink, and yellow floating playfully around the subject, stamped with tiny romantic phrases with soft shadows as they drift.',
  'the floating pastel candy hearts'
);

// 35. Bearded Holiday (Santa Beard)
MASTER_PROMPTS['stk_dio_bearded_holiday'] = buildPrompt(
  'a fluffy snow-white Santa Claus costume beard and mustache in a warm holiday celebration style',
  'Place a classic fluffy, snow-white Santa costume beard and mustache resting over the chin and upper lip, showing rich woolly texture and festive holiday charm while keeping eyes and forehead clear.',
  'the Santa Claus costume beard and mustache'
);

// 36. Frosty
MASTER_PROMPTS['stk_dio_frosty'] = buildPrompt(
  'delicate frozen snowflakes, glistening white frost crystals, and soft winter mist with an icy-blue rim glow',
  'Adorn the surroundings with intricate geometric frost crystals, falling snowflakes, and a gentle ethereal winter mist. Cool icy-blue rim lighting traces clothing edges with magical winter shimmer.',
  'the winter frost, snowflakes, and cool rim lighting'
);

// 37. Elf
MASTER_PROMPTS['stk_dio_elf'] = buildPrompt(
  'a pointed green and red Christmas elf hat with a golden jingle bell on top of the head',
  'Place a festive felt Christmas elf hat with alternating green and red zigzag cuffs and a shiny brass jingle bell at the tip, resting naturally on top of the head with realistic fabric drape.',
  'the Christmas elf hat accessory'
);

// 38. Santa
MASTER_PROMPTS['stk_dio_santa'] = buildPrompt(
  'a classic red velvet Santa Claus hat with fluffy white fur trim and pompom on top of the head',
  'Place a plush scarlet red velvet Santa Claus hat with voluminous snow-white faux fur trim and a fluffy white pompom falling gracefully to one side, casting soft contact shadows on the hair.',
  'the Santa Claus hat accessory'
);

// 39. Easter Bunny
MASTER_PROMPTS['stk_dio_easter_bunny'] = buildPrompt(
  'a cozy white plush bunny hoodie with upright bunny ears framing the head',
  'Frame the head with a soft fleece white bunny hoodie featuring tall upright bunny ears with pastel pink inner lining, framing the forehead and hair naturally while leaving the entire face unobstructed.',
  'the bunny ear hoodie costume piece'
);

// 40. Leprechaun
MASTER_PROMPTS['stk_dio_leprechaun'] = buildPrompt(
  'an emerald-green St. Patrick leprechaun top hat with a black band and gold buckle on top of the head',
  'Place a tall structured emerald-green felt top hat with a wide black leather band and polished brass buckle resting naturally on the crown of the head with realistic felt texture.',
  'the leprechaun top hat accessory'
);

// 41. Easter Chick
MASTER_PROMPTS['stk_dio_easter_chick'] = buildPrompt(
  'a cute bright yellow chick costume hoodie with a small orange beak framing the head',
  'Add a cheerful bright yellow plush chick costume hood framing the head, detailed with tiny chick wings and a small orange beak above the forehead, keeping the face fully visible.',
  'the chick costume hood'
);

// 42. Lucky Face
MASTER_PROMPTS['stk_dio_lucky_face'] = buildPrompt(
  'a vibrant green four-leaf clover decal on the cheek with subtle emerald sparkle accents',
  'Place a clean, glossy four-leaf clover sticker decal on the upper cheek, accompanied by delicate emerald sparkle highlights and subtle sun-kissed freckles across the bridge of the nose.',
  'the clover cheek decal and sparkle accents'
);

// 43. Rose Flower
MASTER_PROMPTS['stk_rose_flower'] = buildPrompt(
  'a fresh, elegant red long-stem rose held near the hand or placed gracefully beside the subject',
  'Add a vivid velvety red rose bloom with dew-kissed petals and rich green leaves positioned naturally near the subject, interacting realistically with ambient scene lighting and depth of field.',
  'the red rose flower element'
);

// 44. Shrek Ogre
MASTER_PROMPTS['stk_shrek_ogre'] = buildPrompt(
  'a cute playful green ogre Shrek headband with trumpet ears on top of the head',
  'Place a cute novelty plastic headband featuring two trumpet-shaped green Shrek ogre ears resting neatly on the hair. The headband conforms naturally to the head without modifying face or skin color.',
  'the novelty Shrek ear headband accessory'
);

// 45. Superhero Cape
MASTER_PROMPTS['stk_superhero_cape'] = buildPrompt(
  'a heroic flowing red superhero cape billowing gracefully behind the shoulders',
  'Add a brilliant scarlet satin superhero cape draping behind the subject\'s shoulders, with dynamic billowing fabric folds and subtle metallic neck clasps catching ambient light.',
  'the superhero cape draping behind the subject'
);

// 46. Spooky Ghost
MASTER_PROMPTS['stk_spooky_ghost'] = buildPrompt(
  'a friendly translucent glowing cute cartoon ghost floating gently beside the subject in the background',
  'Introduce a friendly, luminous cute cartoon ghost hovering softly in the background. The ghost has a gentle cyan ethereal glow, adorable expressive eyes, and floating wisps that do not obscure the subject.',
  'the background cartoon ghost figure'
);

// 47. Pirate Hat
MASTER_PROMPTS['stk_pirate_hat'] = buildPrompt(
  'a classic weathered black pirate tricorn hat with gold trim on top of the head',
  'Place an authentic pirate captain tricorn hat made of textured black weathered leather with antique gold embroidery trim and a small plume feather, resting naturally on top of the head.',
  'the pirate captain hat accessory'
);

// 48. Volcano Lava
MASTER_PROMPTS['stk_volcano_lava'] = buildPrompt(
  'warm dramatic volcanic glow and floating ember sparks in the background surroundings',
  'Enrich the background atmosphere with glowing golden-orange ember sparks drifting through the air, subtle heat shimmer, and a dramatic warm sunset volcanic glow illuminating the background horizon.',
  'the background volcanic atmosphere and floating embers'
);

// 49. Rain Storm
MASTER_PROMPTS['stk_rain_storm'] = buildPrompt(
  'gentle translucent raindrops falling softly and atmospheric romantic rainy mist in the surroundings',
  'Add delicate fine rain streaks falling softly through the background, with gentle wet reflections on distant background surfaces and a moody, atmospheric romantic rainy-day aesthetic.',
  'the raindrops and atmospheric mist'
);

// 50. Fortnite Llama
MASTER_PROMPTS['stk_fortnite_llama'] = buildPrompt(
  'a colorful festive Fortnite pinata llama standing beside the subject and floating party confetti',
  'Place a colorful stylized Fortnite pinata llama figure with purple, turquoise, and pink paper fringe textures standing playfully in the background, accompanied by celebratory floating party confetti.',
  'the background Fortnite llama pinata'
);

// 51. Watercolor Art
MASTER_PROMPTS['stk_watercolor_art'] = buildPrompt(
  'soft pastel watercolor paint flourishes and colorful artistic splashes in the background borders',
  'Frame the outer borders and margins of the image with elegant watercolor pigment washes, translucent paint splatters, and floral brush strokes in pastel tones, leaving the subject crisp and photographic.',
  'the decorative watercolor margins and borders'
);

// 52. Golden Hour
MASTER_PROMPTS['stk_golden_hour'] = buildPrompt(
  'warm radiant golden-hour sunlight glow, sun flare accents, and amber illumination across the background',
  'Cast breathtaking golden-hour sunlight across the scene, featuring soft sun flares, warm amber rim lighting tracing the subject\'s outline, and golden cinematic atmosphere in the background.',
  'the golden hour sunlight and atmospheric glow'
);

// 53. Jungle Leaf
MASTER_PROMPTS['stk_jungle_leaf'] = buildPrompt(
  'vibrant tropical green palm and monstera leaves framing the borders of the scene',
  'Frame the camera perimeter with glossy tropical monstera and palm foliage, showing natural leaf veins, dewdrops, and soft foreground depth of field that frames the subject beautifully.',
  'the tropical leaf framing around the borders'
);

// 54. Cute Zombie
MASTER_PROMPTS['stk_cute_zombie'] = buildPrompt(
  'a cute cartoon mini zombie decal on the clothing and gentle subtle Halloween floating sparkles',
  'Pin a cute enamel cartoon zombie character badge on the clothing lapel and add subtle whimsical purple and green fairy sparkles floating in the background for a lighthearted Halloween vibe.',
  'the enamel zombie badge and background sparkles'
);

// 55. Fireworks
MASTER_PROMPTS['stk_fireworks'] = buildPrompt(
  'brilliant colorful celebratory fireworks bursting in the background night sky with ambient party illumination',
  'Fill the distant background sky with vibrant fireworks bursts in gold, ruby, and sapphire, with shimmering glitter trails and warm festive ambient party glow reflecting softly across the scene.',
  'the background fireworks display and festive glow'
);

// 56. New Year 2026
MASTER_PROMPTS['stk_new_year_2026'] = buildPrompt(
  'glittering gold 2026 celebration glasses and colorful floating confetti throughout the scene',
  'Place celebratory gold glitter novelty glasses shaped like "2026" on the face with clear transparent openings for the eyes, accompanied by floating gold foil confetti drifting throughout the air.',
  'the 2026 novelty glasses and floating confetti'
);

// 57. Harry Potter
MASTER_PROMPTS['stk_harry_potter'] = buildPrompt(
  'iconic round black spectacles on the face and a glowing magical wand with golden sparks in the background',
  'Add classic thin black circular wireframe glasses resting on the nose with crystal-clear lenses showing the eyes fully, paired with a carved wooden wand emitting delicate golden magical sparks in the background.',
  'the round glasses and magical wand with sparks'
);

// 58. Minecraft
MASTER_PROMPTS['stk_minecraft'] = buildPrompt(
  'a pixelated 8-bit Minecraft diamond sword and floating pixel blocks in the background around the subject',
  'Add an authentic 8-bit pixelated Minecraft diamond sword held or placed beside the subject, with cubic voxel pixel blocks floating playfully in the background, matching iconic gaming aesthetics.',
  'the pixel art sword and floating blocks'
);

// 59. Fire Flame
MASTER_PROMPTS['stk_fire_flame'] = `Show the persons in the photo with the exact same pose and background, but with a dramatic theatrical flame effect appearing safely in front of the subject, captured with a modern iPhone camera look.

The flame should appear as a staged visual effect, suspended in front with a bright yellow-white core, orange and red edges, subtle motion blur, and gentle heat distortion in the nearby air.

Add a soft warm glow on nearby clothing, consistent with the flame's position, while preserving the original lighting of the scene. Do not show burns, smoke, damage, or distress. Do not alter the person's face, expression, identity, or pose.

Keep the background, framing, depth of field, and image quality identical to the original, with the flame effect appearing as a safe staged performance element captured in-camera. Do not change the overall composition of the photo, do not add new people to the photo, only show each person in the photo one time.`;

// 60. Giant Spider
MASTER_PROMPTS['stk_giant_spider'] = buildPrompt(
  'a playful cute decorative cartoon Halloween spider on a silk thread in the upper corner of the background',
  'Hang a plush cartoon black spider with big friendly eyes from a delicate silver web strand in the upper background corner, adding whimsical Halloween party decor without obscuring the subject.',
  'the decorative cartoon spider in the upper corner'
);

// 61. Ocean Underwater
MASTER_PROMPTS['stk_ocean_underwater'] = buildPrompt(
  'shimmering aquatic light caustics, floating bubbles, and colorful tiny tropical fish swimming in the background',
  'Overlay crystalline sunlight water caustics dancing softly across the scene, with translucent floating bubbles and a few tiny vibrant clownfish swimming playfully through the background.',
  'the aquatic caustics, bubbles, and swimming fish'
);

// 62. UFO Alien
MASTER_PROMPTS['stk_ufo_alien'] = buildPrompt(
  'a small cute glowing UFO spacecraft hovering gently in the distant background with sparkling starlight',
  'Place a miniature sci-fi flying saucer with soft glowing neon cyan lights hovering peacefully in the distant background sky, surrounded by subtle starry sparkles and starlight glints.',
  'the distant UFO spacecraft and starry sparkles'
);

// Tạo bảng ánh xạ mở rộng (Full mapping) cho toàn bộ biến thể
const outputMap = {};
for (const [key, prompt] of Object.entries(MASTER_PROMPTS)) {
  outputMap[key] = prompt;
  const noStk = key.replace(/^stk_/, '');
  outputMap[noStk] = prompt;
  if (noStk.startsWith('dio_')) {
    const noDio = noStk.replace(/^dio_/, '');
    outputMap[noDio] = prompt;
  }
}

// Các alias đặc biệt của Locket
outputMap['cash_money'] = outputMap['stk_dio_cash'];
outputMap['disco_lights'] = outputMap['stk_dio_disco'];
outputMap['looks_maxxing'] = outputMap['stk_dio_looksmaxing'];
outputMap['okay_wig'] = outputMap['stk_dio_orange_wig'];
outputMap['blonde_bleached'] = outputMap['stk_dio_bleached_hair'];
outputMap['bob_cut'] = outputMap['stk_dio_bob'];
outputMap['beard'] = outputMap['stk_dio_bearded'];
outputMap['sweet_hearts'] = outputMap['stk_dio_sweat_hearts'];
outputMap['elf_cutout'] = outputMap['stk_dio_elf'];
outputMap['santa_cutout'] = outputMap['stk_dio_santa'];
outputMap['easter_bunney_cutout'] = outputMap['stk_dio_easter_bunny'];
outputMap['easter_chick_cutout'] = outputMap['stk_dio_easter_chick'];
outputMap['cowboy_cowgirl'] = outputMap['stk_dio_cowboy'];

const targetPath = path.join(__dirname, '..', 'data', 'ai_prompts.json');
fs.writeFileSync(targetPath, JSON.stringify(outputMap, null, 2), 'utf8');
console.log('Successfully generated MASTER ai_prompts.json for ios_test! Total keys:', Object.keys(outputMap).length);
