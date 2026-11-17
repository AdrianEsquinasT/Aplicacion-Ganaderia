#!/usr/bin/env python3
"""Genera las ilustraciones de ejemplo (vacas, toros y terneros de perfil) en public/demo/animales/.
Son dibujos vectoriales originales, sin fotografías ni licencias de terceros.
Uso: python3 scripts/ilustraciones.py"""
import os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'demo', 'animales')

# base, sombra, claro (vientre, hocico, contorno de ojos)
PAL = {
    'trigo':  ('#d9a066', '#b47a42', '#f0d5a8'),
    'rojo':   ('#c2693a', '#97481f', '#e8b78d'),
    'rubio':  ('#e6bf86', '#c79a55', '#f7e6c6'),
    'caoba':  ('#a35a2e', '#7a3d1b', '#d8a47c'),
    'negro':  ('#3b3531', '#231f1c', '#7a7068'),
    'dorado': ('#d08c4e', '#a66528', '#ecc79b'),
}

SCENES = [
    # cielo arriba, cielo abajo, colinas, hierba arriba, hierba abajo
    ('#8cc4ec', '#e4f1f7', '#8aab69', '#79a24b', '#5c8a37'),
    ('#f0b96e', '#f8e5b8', '#9aa35c', '#8c9a45', '#6f8030'),
    ('#bfcbd0', '#e3e8ea', '#7e9a6a', '#6f8e55', '#58763f'),
    ('#9ccbe6', '#eef5f4', '#7ea25d', '#86a853', '#678f3c'),
]


def shade(hexc, k):
    h = hexc.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    f = lambda v: max(0, min(255, int(v * k)))
    return '#%02x%02x%02x' % (f(r), f(g), f(b))


def leg(x, top, w0, w1, bottom=470, bend=0, fill='#000'):
    """Pata: ancho w0 arriba y w1 abajo; 'bend' curva el corvejón hacia atrás."""
    mid = top + (bottom - top) * 0.55
    return (f'<path d="M {x} {top} C {x - bend} {mid - 20} {x - bend - 2} {mid + 10} {x + (w0 - w1) / 2} {bottom} '
            f'L {x + (w0 + w1) / 2} {bottom} C {x + w1 - bend + 6} {mid + 8} {x + w0 - bend + 4} {mid - 24} {x + w0} {top} Z" fill="{fill}"/>'
            f'<rect x="{x + (w0 - w1) / 2 - 1}" y="{bottom}" width="{w1 + 3}" height="11" rx="3" fill="#2a211c"/>')


def scene(i, rnd):
    sky0, sky1, hills, g0, g1 = SCENES[i % len(SCENES)]
    s = [f'<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky0}"/><stop offset="1" stop-color="{sky1}"/></linearGradient>'
         f'<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{g0}"/><stop offset="1" stop-color="{g1}"/></linearGradient></defs>',
         '<rect width="800" height="600" fill="url(#sky)"/>']
    if i % 4 == 1:
        s.append('<circle cx="620" cy="190" r="46" fill="#fff4d0" opacity=".9"/><circle cx="620" cy="190" r="78" fill="#fff4d0" opacity=".25"/>')
    for _ in range(3):
        cx, cy = rnd.randint(80, 720), rnd.randint(50, 170)
        s.append(f'<g fill="#fff" opacity=".75"><ellipse cx="{cx}" cy="{cy}" rx="62" ry="17"/><ellipse cx="{cx + 32}" cy="{cy - 12}" rx="38" ry="15"/><ellipse cx="{cx - 30}" cy="{cy - 7}" rx="34" ry="12"/></g>')
    s.append(f'<path d="M0 360 C 120 310 230 330 340 345 C 470 362 570 300 700 322 C 750 330 780 340 800 335 L800 600 L0 600 Z" fill="{hills}"/>')
    s.append(f'<path d="M0 395 C 150 372 300 392 450 384 C 600 376 700 392 800 380 L800 600 L0 600 Z" fill="{shade(hills, .9)}" opacity=".9"/>')
    if i % 4 == 3:  # valla de madera
        s.append('<g fill="#8b6a45"><rect x="0" y="372" width="800" height="9"/><rect x="0" y="402" width="800" height="9"/>' +
                 ''.join(f'<rect x="{x}" y="355" width="14" height="75" rx="2"/>' for x in range(40, 800, 150)) + '</g>')
    else:  # árboles lejanos
        for _ in range(3):
            tx = rnd.randint(40, 760)
            s.append(f'<g><rect x="{tx - 3}" y="335" width="6" height="28" fill="#6b5236"/><circle cx="{tx}" cy="326" r="24" fill="{shade(hills, .78)}"/><circle cx="{tx - 14}" cy="338" r="16" fill="{shade(hills, .85)}"/></g>')
    s.append(f'<rect y="430" width="800" height="170" fill="url(#gr)"/>')
    for _ in range(90):
        gx, gy = rnd.randint(0, 800), rnd.randint(440, 598)
        h = rnd.randint(6, 16)
        s.append(f'<path d="M{gx} {gy} q {rnd.randint(-3, 3)} {-h / 2} {rnd.randint(-5, 5)} {-h}" stroke="{shade(g1, rnd.uniform(.85, 1.2))}" stroke-width="2" fill="none" opacity=".8"/>')
    return ''.join(s)


def animal(kind, pal, horned, flip, scale, rnd):
    base, dark, light = PAL[pal]
    bull, calf = kind == 'bull', kind == 'calf'
    dy = 46 if calf else 0          # los terneros: cuerpo más alto sobre patas largas y finas
    legw = 0.72 if calf else (1.18 if bull else 1.0)
    hs = 1.28 if calf else (1.08 if bull else 1.0)  # escala de la cabeza
    # espalda: el toro tiene cruz musculosa
    back = ('C 330 224 420 222 478 212 C 535 202 585 214 602 252' if bull else 'C 330 222 420 226 500 224 C 540 222 575 236 590 262')
    neck = ('M 548 222 C 602 206 654 226 676 258 L 684 352 C 646 374 600 366 574 346 Z' if bull
            else 'M 560 240 C 600 235 640 245 665 262 L 672 330 C 640 345 610 345 585 335 Z')
    o = []
    o.append(f'<defs><linearGradient id="coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{shade(base, 1.08)}"/><stop offset=".6" stop-color="{base}"/><stop offset="1" stop-color="{dark}"/></linearGradient>'
             f'<linearGradient id="belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{light}" stop-opacity="0"/><stop offset="1" stop-color="{light}" stop-opacity=".85"/></linearGradient></defs>')
    o.append('<ellipse cx="430" cy="478" rx="290" ry="17" fill="#1b2a10" opacity=".28"/>')
    ground = 470
    # patas lejanas (más oscuras)
    far = shade(dark, .92)
    o.append(leg(300, 340 - dy, 38 * legw, 22 * legw, ground, 6, far))
    o.append(leg(500, 350 - dy, 36 * legw, 21 * legw, ground, 0, far))
    # cola
    o.append(f'<path d="M 176 292 C 146 300 136 352 148 420" stroke="{dark}" stroke-width="7" fill="none" stroke-linecap="round"/>'
             f'<ellipse cx="148" cy="430" rx="9" ry="24" fill="{shade(dark, .6)}"/>')
    o.append(f'<g transform="translate(0 {-dy})">')
    # ubre (vacas)
    if kind == 'cow':
        o.append('<ellipse cx="292" cy="404" rx="32" ry="20" fill="#e9b9aa"/><rect x="278" y="414" width="6" height="12" rx="3" fill="#d99f90"/><rect x="298" y="414" width="6" height="12" rx="3" fill="#d99f90"/>')
    if bull:
        o.append(f'<ellipse cx="300" cy="404" rx="20" ry="25" fill="{shade(dark, .85)}"/>')
    # cuerpo
    body = f'M 170 300 C 165 262 200 232 255 228 {back} L 604 330 C 594 372 562 394 520 398 C 440 404 330 402 262 394 C 215 388 178 352 170 300 Z'
    o.append(f'<path d="{body}" fill="url(#coat)"/>')
    o.append(f'<path d="M 190 350 C 260 392 440 404 584 366 L 560 396 C 440 410 300 408 230 392 Z" fill="url(#belly)"/>')
    # musculatura: cadera y paletilla
    o.append(f'<path d="M 200 290 C 230 250 290 262 300 330 C 262 350 214 340 200 290 Z" fill="{dark}" opacity=".16"/>')
    o.append(f'<path d="M 470 262 C 520 250 566 290 552 350 C 510 360 470 320 470 262 Z" fill="{dark}" opacity=".16"/>')
    o.append(f'<path d="M 250 236 C 360 226 470 230 560 240" stroke="{shade(base, 1.2)}" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>')
    # patas cercanas
    o.append('</g>')
    o.append(leg(205, 336 - dy, 52 * legw, 26 * legw, ground, 22, base))
    o.append(leg(548, 372 - dy, 46 * legw, 25 * legw, ground, 0, base))
    o.append(f'<g transform="translate(0 {-dy})">')
    # cuello y cabeza
    o.append(f'<path d="{neck}" fill="url(#coat)"/>')
    if bull:
        o.append(f'<path d="M 596 240 C 640 244 664 262 668 292" stroke="{dark}" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>')
    else:
        pass
    o.append(f'<g transform="translate(660 300) scale({hs}) translate(-660 -300)">')
    # cuernos
    if horned:
        hw = 11 if bull else 8
        o.append(f'<path d="M 668 258 C 662 232 676 208 704 202 C 690 218 688 238 690 258 Z" fill="#efe3c6" stroke="#cdbd96" stroke-width="2"/>')
        if bull:
            o.append('<path d="M 700 264 C 722 244 744 238 756 246 C 740 246 726 254 714 270 Z" fill="#efe3c6" stroke="#cdbd96" stroke-width="2"/>')
    else:
        o.append(f'<ellipse cx="672" cy="256" rx="12" ry="7" fill="{shade(base, .8)}"/>')
    o.append(f'<path d="M 650 262 C 626 248 608 256 598 270 C 620 284 642 282 656 276 Z" fill="{shade(base, .85)}"/><path d="M 646 266 C 630 260 616 264 608 272 C 622 278 636 278 650 274 Z" fill="#d8a392" opacity=".7"/>')
    o.append(f'<path d="M 650 258 C 675 248 702 262 724 292 C 742 318 754 338 752 354 C 750 368 730 374 712 370 C 690 366 666 346 654 322 C 646 300 644 276 650 258 Z" fill="url(#coat)"/>')
    o.append(f'<ellipse cx="737" cy="356" rx="22" ry="17" transform="rotate(-24 737 356)" fill="{light}"/><ellipse cx="744" cy="350" rx="5" ry="3.6" fill="#3a2a24" transform="rotate(-20 744 350)"/>')
    o.append(f'<path d="M 722 372 C 730 372 738 369 744 364" stroke="#5a3d32" stroke-width="2" fill="none"/>')
    o.append(f'<ellipse cx="690" cy="286" rx="14" ry="11" fill="{light}" opacity=".9"/><ellipse cx="690" cy="286" rx="5.5" ry="5.5" fill="#1d1612"/><circle cx="692" cy="284" r="1.7" fill="#fff"/>')
    o.append('</g>')
    o.append('</g>')
    inner = ''.join(o)
    tf = f'translate(400 480) scale({scale}) translate(-400 -480) translate(-55 0)'
    g = f'<g transform="{tf}">{inner}</g>'
    if flip:
        g = f'<g transform="translate(800 0) scale(-1 1)">{g}</g>'
    return g


def make(name, kind, pal, horned, flip, scene_i, scale):
    rnd = random.Random(hash(name) & 0xffff)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="{name}">'
           + scene(scene_i, random.Random(scene_i * 97 + len(name))) + animal(kind, pal, horned, flip, scale, rnd) + '</svg>')
    with open(os.path.join(OUT, name + '.svg'), 'w') as f:
        f.write(svg)


# nombre de archivo = id del animal o semental en seed.ts
LISTA = [
    # vacas
    ('a-v125', 'cow', 'trigo', False, False, 0, .9), ('a-v125-b', 'cow', 'trigo', False, True, 1, .92),
    ('a-v087', 'cow', 'rojo', True, True, 3, .9), ('a-v098', 'cow', 'rubio', False, False, 2, .9),
    ('a-v133', 'cow', 'dorado', False, True, 0, .9), ('a-v142', 'cow', 'rubio', True, False, 1, .9),
    ('a-luna', 'cow', 'trigo', False, True, 3, .84), ('a-estrella', 'cow', 'dorado', False, False, 2, .86),
    ('a-gala', 'cow', 'rojo', False, True, 0, .86), ('a-v051', 'cow', 'caoba', True, False, 3, .9),
    # toros y sementales
    ('a-t034', 'bull', 'caoba', True, False, 1, .9), ('a-t041', 'bull', 'trigo', True, True, 0, .9),
    ('s-rumba', 'bull', 'dorado', False, False, 2, .9), ('s-forro', 'bull', 'negro', True, True, 3, .9),
    ('s-galan', 'bull', 'rojo', False, False, 1, .9),
    # terneros
    ('a-trueno', 'calf', 'trigo', False, False, 0, .66), ('a-perla', 'calf', 'rubio', False, True, 2, .66),
    ('a-capitan', 'calf', 'rojo', False, False, 3, .66), ('a-pinto', 'calf', 'dorado', False, True, 1, .66),
    ('a-bravo', 'calf', 'caoba', False, False, 0, .66),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for spec in LISTA:
        make(*spec)
    print(len(LISTA), 'ilustraciones generadas en', os.path.normpath(OUT))
