# Stereogram-WebGL — real-time Magic Eye generator

A browser-based **autostereogram ("Magic Eye") generator** that runs entirely on the GPU with WebGL. Give it a depth map and a tile pattern, and it builds a flat image with a hidden 3D scene inside — in real time, even for moving scenes.

This is my extended version of an open-source tool originally created by [Jérémie Piellard](https://github.com/piellardj). I reworked parts of the interface and added several features on top — see [What I added](#what-i-added) and [Credits](#credits).

**▶ [Try it live](https://williambottini-svg.github.io/stereogram-webgl/)**  ·  [How it works](#how-does-it-work)

<!-- Wave 3: replace this comment with a short looping demo GIF of the tool in action. -->

## What I added

Building on the original WebGL engine, my contributions include:

- **Fullscreen preview** — a distraction-free viewing mode (square or fill-screen) with cross-browser Fullscreen API handling, so the hidden 3D scene is easier to actually see.
- **Pattern placement & crop controls** — offset, zoom, repeat-scale, and crop the tile pattern live.
- **Refined controls** — direct numeric entry and a reset button on every slider, plus collapsible control sections that remember their state between visits.
- **PWA / offline support** — a service worker so the tool can be installed and used offline.
- **High-DPI export** — render and download at 1024 / 2048 / 4096 px regardless of screen pixel density.
- **In-page attribution** — the live page credits the original author in its footer.

I did **not** write the core autostereogram algorithm — that is the original author's work, explained in [How does it work](#how-does-it-work).

## Features

- Runs entirely on the GPU (WebGL); handles live, moving scenes in real time
- Use your own depth map and tile pattern, or pick from built-in presets
- Noise or texture tile modes
- Adjustable depth, stripe count / width, and central-stripe mode
- Export to PNG at up to 4096 px

## Built with

- **TypeScript** and **WebGL** (GLSL shaders)
- A declarative control-panel framework (`webpage-templates`)
- webpack build pipeline
- Hosted on GitHub Pages

## Preview

![Planet](src/readme/preview_planet.jpg)

![Ship](src/readme/preview_ship.jpg)

![Ripple](src/readme/preview_ripple.jpg)

## Run locally

1. Install [Node.js](https://nodejs.org/) **18.16 or newer** (see `engines` in `package.json`).
2. In the project folder, install dependencies and build the site:

   ```bash
   npm install
   npm run build
   ```

3. Start a local server and open **http://localhost:8080** in your browser:

   ```bash
   npm run http-server
   ```

To rebuild after you change source files, run `npm run build` again (or use `npm run webpack:watch` in another terminal while `http-server` stays running).

## How to see a stereogram image

> The instructions and practice images in this section are from the original project by [Jérémie Piellard](https://github.com/piellardj).

### Instructions
Seeing the 3D scene hidden in a stereogram image takes a bit of practice. The key is to look beyond the image, and not focus the image itself. There are several techniques to do it:
- if you are able to, just consciously relax your eyes like if you were looking in the distance
- another technique is to start with your head very close to the screen, so close that you cannot focus it. At this point your eyes should naturally look in the distance. Then move your head back slowly, and don't look at the screen: try to keep your eyes looking in the vague
- another one is to use an object like a pen: place it behind your screen, on the side so you can see it. Keep staring at it, and move it slowly towards the center of the screen. This should help you look beyond the screen.

If you cannot quite see a clear 3D object but you still feel something weird, you are certainly on good track.

### Exercises
Below are images you can practice on while training. For each of them, you need to have the correct way of looking at them.

<div style="text-align:center;margin:48px 0">
    <p>
        <i>Try to relax your eyes, and you should see a third black dot appear in the middle.</i>
    </p>
    <img alt="First practice image" src="src/readme/tutorial_easy.png"/>
</div>

<div style="text-align:center;margin:48px 0">
    <p>
        <i>Practice your look on this image, and you should see each row float at a different depth: the daisies look far away, the red flowers are a bit closer, then the blue butterfly, and finally the yellow flowers are the closest.</i>
    </p>
    <img alt="Second practice image" src="src/readme/tutorial_medium.png"/>
</div>

<div style="text-align:center;margin:48px 0">
    <p>
        <i>This is the last practice image. If you look at it correctly, you should clearly see a 3D object.</i>
    </p>
    <img alt="Last practice image" src="src/readme/tutorial_hard.jpg"/>
</div>

## How does it work

> The explanation and diagrams in this section are from the original project by [Jérémie Piellard](https://github.com/piellardj).

### Base idea

The brain perceives depth by combining the two slightly different images coming from our eyes. If an object looks exactly the same from both eyes, it means the object is far in the distance. On the contrary, if an object looks very different from each eye, it means the eyes each have a different perspective on it, so the object must be very close.

Since depth perception is based on binocular vision, if we want the show a 3D object in our 2D image, we must trick the brain into thinking each eye sees a different perspective of our 3D object. If you look directly at the image, it does not work: the brain clearly sees the image is 2D. So the viewer has to focus a point either before the image, or behind it.

Now, we must understand how to build the image. Let's see what happens if someones looks at an object through a transparent screen:

<div style="text-align:center">
    <img alt="Depth creates repetition" src="src/readme/diagram-01.png"/>
    <p>
        <i>As you can see, there are two "ghosts" of the object on the screen, because of the eyes having different positions relatively to the object.</i>
    </p>
</div>

Now let's compare two situations: one object is near and the other is far away:

<div style="text-align:center">
    <img alt="Repetition period vary with distance" src="src/readme/diagram-02.png"/>
    <p>
        <i>The closer an object is to the screen, the closer its ghosts are on the screen.</i>
    </p>
</div>

In conclusion, provided the viewer does not look directly at the image but beyond it, if we repeat some pattern on the image, the brain will interpret it as the pattern actually being behind the screen. Moreover, by changing the frequency of the repetitions, we can create an impression of relative depth: a pattern with close repetitions will appear closer than a pattern with distanced repetitions. This explains why on the image below, the daisies appear further away than the butterflies.

<div style="text-align:center">
    <img alt="Depth perception and repetition frequency" src="src/readme/tutorial_medium.png"/>
    <p>
        <i>When looking beyond this image, the daisies appear further away than the butterflies because of the difference in repetition frequency.</i>
    </p>
</div>

Another interesting property is that only one repetition is needed to perceive depth. This means that on a same row, we can vary the perceived depth by changing the frequency of the repetitions, creating a slope effect.

<div style="text-align:center">
    <img alt="We can change depth on a single row" src="src/readme/frequency-change.png"/>
    <p>
        <i>On each row, the repetition frequency varies. This gives the perception of depth variation on each row.</i>
    </p>
</div>

### Algorithm
We want to generate an autostereogram given the following inputs:
- a depth map encoded as a black and white image, in this example a sphere;
- a base pattern, in this example a seamless clouds texture.

Since this is all about repetition, let's define our base repetition period in pixels. Then let's split our target image into vertical stripes, each having the repetition period as width.

<div style="text-align:center">
    <img alt="Image split in stripes" src="src/readme/demo_stripes_empty.png"/>
    <p>
        <i>Target image split into 5 vertical stripes, plus the reference stripe on the left.</i>
    </p>
</div>

Since this is all about repetition, let's make each stripe a repetition of the previous one. The far-left stripe serves as reference:

<div style="text-align:center">
    <img alt="Repetition without displacement" src="src/readme/demo_stripes.png"/>
    <p>
        <i>By repeating the first stripe without displacement, the viewer only perceives a flat surface.</i>
    </p>
</div>

Now we want to make it 3D, so let's introduce horizontal displacement: each stripe will be a displaced version of the previous one. Each pixel has a distinct local displacement, given by sampling the depth map at that position. Since the far-left stripe is the first one, it does not have a reference so it will not be deformed. However I do not want to truncate the depth map, so just scale it down and shift it to the right so that all of it is sampled.

<div style="text-align:center">
    <img alt="Repetition with displacement" src="src/readme/demo_final.png"/>
    <p>
        <i>By repeating the first stripe and adding with displacement, the viewer perceives the 3D objects.</i>
    </p>
</div>

In the end, every pixel on the image is a displaced version of the source stripe. Here is an illustration to better see the displacement:

<div style="text-align:center">
    <img alt="Repetition with displacement" src="src/readme/demo_uv.png"/>
    <p>
        <i>By displaying the UV coordinates the tile will be sampled at, the displacement is more visible. One can clearly see the sphere-shaped displacement sampled from the depth map.</i>
    </p>
</div>

## Credits

This project is a fork and extension of **[stereogram-webgl](https://github.com/piellardj/stereogram-webgl)** by **[Jérémie Piellard](https://github.com/piellardj)** ([website](https://piellardj.github.io)), used under the MIT License. The core WebGL autostereogram engine, the explanatory text in *How to see a stereogram image* and *How does it work*, and all the practice images, diagrams, and preview renders above are his original work.

If you'd like to support the original author, his donation link is on the [original repository](https://github.com/piellardj/stereogram-webgl). He also built a [Magic Eye solver](https://piellardj.github.io/stereogram-solver/).

## License

Released under the MIT License — see [LICENSE](LICENSE). Original work © 2021 Jérémie Piellard; modifications © 2026 William Bottini.
