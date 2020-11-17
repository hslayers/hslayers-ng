import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsStylerColorService {
  /* NOTE: Be careful with the color strings. Spaces are important 
  since they are used in findAndParseColor function */
  colors = [
    {
      'background-color': 'rgba(244, 235, 55, 1)',
    },
    {
      'background-color': 'rgba(0, 0, 0, 1)',
    },
    {
      'background-color': 'rgba(205, 220, 57, 1)',
    },
    {
      'background-color': 'rgba(98, 175, 68, 1)',
    },
    {
      'background-color': 'rgba(0, 157, 87, 1)',
    },
    {
      'background-color': 'rgba(11, 169, 204, 1)',
    },
    {
      'background-color': 'rgba(65, 134, 240, 1)',
    },
    {
      'background-color': 'rgba(63, 91, 169, 1)',
    },
    {
      'background-color': 'rgba(124, 53, 146, 1)',
    },
    {
      'background-color': 'rgba(166, 27, 74, 1)',
    },
    {
      'background-color': 'rgba(219, 68, 54, 1)',
    },
    {
      'background-color': 'rgba(248, 151, 27, 1)',
    },
    {
      'background-color': 'rgba(244, 180, 0, 1)',
    },
    {
      'background-color': 'rgba(121, 80, 70, 1)',
    },
    {
      'background-color': 'rgba(249, 247, 166, 1)',
    },
    {
      'background-color': 'rgba(230, 238, 163, 1)',
    },
    {
      'background-color': 'rgba(183, 219, 171, 1)',
    },
    {
      'background-color': 'rgba(124, 207, 169, 1)',
    },
    {
      'background-color': 'rgba(147, 215, 232, 1)',
    },
    {
      'background-color': 'rgba(159, 195, 255, 1)',
    },
    {
      'background-color': 'rgba(167, 181, 215, 1)',
    },
    {
      'background-color': 'rgba(198, 164, 207, 1)',
    },
    {
      'background-color': 'rgba(214, 152, 173, 1)',
    },
    {
      'background-color': 'rgba(238, 156, 150, 1)',
    },
    {
      'background-color': 'rgba(250, 209, 153, 1)',
    },
    {
      'background-color': 'rgba(255, 221, 94, 1)',
    },
    {
      'background-color': 'rgba(178, 145, 137, 1)',
    },
    {
      'background-color': 'rgba(255, 255, 255, 1)',
    },
    {
      'background-color': 'rgba(204, 204, 204, 1)',
    },
    {
      'background-color': 'rgba(119, 119, 119, 1)',
    },
    {
      'background-color': 'rgba(51, 153, 204, 1)',
    },
  ];

  blank = {
    'background-color': 'rgba(244, 235, 54, 0)',
  };

  parseColor(input: string): number[] {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let tmp = null;
    div.style.backgroundColor = input;
    const computedColor = getComputedStyle(div, null).getPropertyValue(
      'background-color'
    );
    //Parse rgb color
    let m = computedColor.match(
      /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i
    );
    if (m) {
      tmp = [m[1], m[2], m[3]];
    }

    //In rgba case when alpha is a float with decimal dot
    m = computedColor.match(
      /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+\.\d+)?\s*\)$/i
    );
    if (m) {
      tmp = [m[1], m[2], m[3], m[4]];
    }

    //In rgba case when alpha is not a float but integer
    m = computedColor.match(
      /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)?\s*\)$/i
    );
    if (m) {
      tmp = [m[1], m[2], m[3], m[4]];
    }
    document.body.removeChild(div);
    return tmp;
  }

  findAndParseColor(color: string): {'background-color'} {
    const parsed = this.parseColor(color);
    if (parsed) {
      const found = this.colors.filter(
        (c) =>
          c['background-color'] ==
          `rgba(${parsed[0]}, ${parsed[1]}, ${parsed[2]}, 1)`
      );
      if (found.length > 0) {
        return found[0];
      }
    }
  }
}
