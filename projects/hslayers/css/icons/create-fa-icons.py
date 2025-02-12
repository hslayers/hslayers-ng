"""
Process the Font Awesome CSS and font files to create a minimal, optimized version that
includes only the specified icons in both regular and solid variants.

Usage:
    python create-fa-icons.py --icons-file path/to/icons.txt --output-file path/to/output.css [--fa-path path/to/fontawesome]

Arguments:
    --icons-file: Path to text file containing icon names (one per line)
    --output-file: Path where the generated CSS will be saved
    --fa-path: (Optional) Path to @fortawesome/fontawesome-free package
               If not provided, will try to find it in node_modules
"""

import re
import base64
import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from fontTools.subset import main as subset_font
from fontTools.ttLib import TTFont


@dataclass
class FontConfig:
    """Configuration for a Font Awesome font variant."""
    type_name: str  # solid, regular, or brands
    weight: str    # 900 for solid, 400 for regular/brands
    family: str    # Font Awesome 6 Free/Brands
    file_name: str  # fa-solid-900.woff2 etc.


class FontProcessor:
    """Handles font file operations like subsetting and encoding."""

    def __init__(self, font_file: Path):
        self.font_file = font_file
        self.font = TTFont(font_file)

    def get_available_glyphs(self) -> Set[int]:
        """Get set of all available unicode glyphs in the font."""
        available_glyphs = set()
        for table in self.font['cmap'].tables:
            available_glyphs.update(table.cmap.keys())
        return available_glyphs

    def create_subset(self, output_file: Path, unicode_list: List[str]) -> None:
        """Create a subset of the font with only specified glyphs."""
        # Filter duplicates and sort
        unicode_list = sorted(set(unicode_list))

        # Convert to fontTools format
        unicode_str = ','.join(f'U+{code.upper()}' for code in unicode_list)

        # Create subset with WOFF2 optimization
        subset_args = [
            str(self.font_file),
            f'--unicodes={unicode_str}',
            '--flavor=woff2',
            '--layout-features=""',
            f'--output-file={str(output_file)}'
        ]
        subset_font(subset_args)


class FontAwesomeProcessor:
    """Main processor for creating Font Awesome icon subsets."""

    # Font configurations for different variants
    FONT_CONFIGS = [
        FontConfig('solid', '900', 'Font Awesome 6 Free',
                   'fa-solid-900.woff2'),
        FontConfig('regular', '400', 'Font Awesome 6 Free',
                   'fa-regular-400.woff2'),
        FontConfig('brands', '400', 'Font Awesome 6 Brands',
                   'fa-brands-400.woff2')
    ]

    def __init__(self):
        self.icon_definitions: Dict[str, str] = {}  # name -> unicode
        self.base_css = ""                         # Base Font Awesome CSS
        self.required_icons: List[str] = []        # Icons from icons.txt

    def load_icon_list(self, icons_file: Path) -> None:
        """Load and validate required icons from icons.txt."""
        print(f"Loading icons from: {icons_file}")
        try:
            with open(icons_file, 'r', encoding='utf-8') as f:
                self.required_icons = [
                    line.strip() for line in f if line.strip()
                ]
            print(f"Loaded {len(self.required_icons)} icons")
        except FileNotFoundError:
            print(f"Error: {icons_file} not found")
            raise

    def parse_css_file(self, css_file: Path) -> None:
        """Extract icon definitions from Font Awesome CSS."""
        print(f"Parsing CSS file: {css_file}")
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()

        # Extract icon definitions using CSS variable pattern
        pattern = r'\.fa-([^{\s]+)\s*{\s*--fa:\s*"\\([^"]+)"'
        matches = re.finditer(pattern, css_content)

        # Store only required icons
        for match in matches:
            name, code = match.group(1), match.group(2)
            if name in self.required_icons:
                self.icon_definitions[name] = code

        print(f"Found {len(self.icon_definitions)} icon definitions")

        # Report any missing icons
        missing = set(self.required_icons) - set(self.icon_definitions.keys())
        if missing:
            print(f"\nWarning: Icons not found: {', '.join(missing)}\n")

    def load_base_css(self, base_css_file: Path) -> None:
        """Load base Font Awesome CSS with core styles."""
        print(f"Loading base CSS from: {base_css_file}")
        if base_css_file.exists():
            with open(base_css_file, 'r', encoding='utf-8') as f:
                self.base_css = f.read()
        else:
            print(
                f"Warning: base.css not found at {base_css_file}, skipping base CSS")

    def process_font(self, font_config: FontConfig, webfonts_dir: Path, output_dir: Path) -> Optional[Tuple[str, str, str]]:
        """Process a single font variant (solid/regular/brands).

        Returns:
            Optional tuple of (base64 encoded font, weight, family) if icons were found
        """
        font_path = webfonts_dir / font_config.file_name
        if not font_path.exists():
            return None

        # Process font file
        processor = FontProcessor(font_path)
        available_glyphs = processor.get_available_glyphs()

        # Find which icons are in this font
        found_icons = {}
        for name, code in self.icon_definitions.items():
            try:
                unicode_value = int(code, 16)
                if unicode_value in available_glyphs:
                    found_icons[name] = code
            except ValueError:
                print(
                    f"Warning: Invalid unicode value for icon {name}: {code}")

        if not found_icons:
            return None

        # Create subset font
        output_font = output_dir / f'fa-{font_config.type_name}-subset.woff2'
        processor.create_subset(output_font, list(found_icons.values()))

        # Encode to base64
        with open(output_font, 'rb') as f:
            encoded_font = base64.b64encode(f.read()).decode('utf-8')

        # Clean up temporary file
        output_font.unlink()

        return encoded_font, font_config.weight, font_config.family

    def generate_css(self, output_file: Path, webfonts_dir: Path) -> None:
        """Generate final CSS with embedded fonts and icon definitions."""
        print(f"Generating CSS at: {output_file}")
        output_dir = output_file.parent
        output_dir.mkdir(exist_ok=True)

        # Start with base CSS if available
        css_content = []
        if self.base_css:
            css_content.extend([self.base_css, ""])

        css_content.append("/* Font face definitions */")

        # Process each font variant
        font_data = []
        for config in self.FONT_CONFIGS:
            result = self.process_font(config, webfonts_dir, output_dir)
            if result:
                font_data.append(result)

        # Add font face definitions
        for encoded_font, weight, family in font_data:
            css_content.append(f"""@font-face {{
                font-family: '{family}';
                font-style: normal;
                font-weight: {weight};
                font-display: block;
                src: url(data:font/woff2;charset=utf-8;base64,{encoded_font}) format('woff2');
            }}
            """)

        # Add icon definitions
        css_content.append("/* Icon definitions */")
        for icon_name, code in self.icon_definitions.items():
            css_content.append(f""".fa-{icon_name} {{
                --fa: "\\{code}";
            }}
            """)

        # Write final CSS
        css_text = '\n'.join(css_content)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(css_text)

        # Log file size
        size_kb = output_file.stat().st_size / 1024
        print(f"Generated CSS file ({size_kb:.1f}KB)")


def find_fontawesome_path(start_path: Path) -> Optional[Path]:
    """Find @fortawesome/fontawesome-free in node_modules."""
    current = start_path
    while current != current.parent:
        fa_path = current / 'node_modules' / '@fortawesome' / 'fontawesome-free'
        if fa_path.exists():
            return fa_path
        current = current.parent
    return None


def main():
    """Main entry point for Font Awesome subsetting process."""
    parser = argparse.ArgumentParser(
        description='Create Font Awesome icon subset')
    parser.add_argument('--icons-file',
                        help='Path to file containing icon names (default: icons.txt in script directory)')
    parser.add_argument('--output-file',
                        help='Path where the generated CSS will be saved (default: hslayers-ng-fa-icons.css in script directory)')
    parser.add_argument(
        '--fa-path', help='Path to @fortawesome/fontawesome-free package')

    args = parser.parse_args()

    try:
        script_dir = Path(__file__).resolve().parent

        # Use default paths for hslayers-ng if not specified
        icons_file = Path(
            args.icons_file) if args.icons_file else script_dir / 'icons.txt'
        output_file = Path(
            args.output_file) if args.output_file else script_dir / 'hslayers-ng-fa-icons.css'

        # Find Font Awesome path
        if args.fa_path:
            fa_path = Path(args.fa_path)
        else:
            fa_path = find_fontawesome_path(script_dir)
            if not fa_path:
                raise FileNotFoundError(
                    "Could not find @fortawesome/fontawesome-free in node_modules")

        processor = FontAwesomeProcessor()

        # Load required data
        processor.load_icon_list(icons_file)
        processor.load_base_css(script_dir / 'base.css')
        processor.parse_css_file(fa_path / 'css' / 'all.css')

        # Generate optimized CSS with embedded fonts
        processor.generate_css(
            output_file=output_file,
            webfonts_dir=fa_path / 'webfonts'
        )

        print(f"\nSuccess! Created Font Awesome subset at: {output_file}")
        print("You can now import this file in your application's styles.")

    except Exception as e:
        print(f"Error: {e}")
        raise


if __name__ == '__main__':
    main()
