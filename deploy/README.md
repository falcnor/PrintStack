# PrintStack

A comprehensive 3D printing inventory management system to track filaments, models, and print history. Built with vanilla HTML, CSS, and JavaScript.

![PrintStack Interface](screenshot.png)

## Features

### 📦 Filament Library
- Track multiple filament types (PLA, PETG, ABS, etc.)
- Monitor filament usage and remaining weight
- Color-coded inventory with hex color picker
- Mark filaments as in-stock or out-of-stock
- Automatic usage calculation based on print history

### 🎨 Models Library
- Organize 3D models you want to print
- Define filament requirements for each model
- Automatic printability status based on available inventory
- Add links to model files or notes
- Smart filament search with autocomplete

### 📊 Print History
- Record completed prints with weight tracking
- Date-stamped print records
- Edit and delete print history
- Automatic deduction from filament inventory

### 📈 Statistics & Analytics
- Usage breakdown by color and model
- Total filament consumed tracking
- Print count statistics
- Identify which models you can currently print

### 💾 Data Management
- Import/Export functionality (JSON format)
- Local storage for data persistence
- Merge or replace options when importing
- No server or database required

## Installation

1. Clone this repository:
```bash
git clone https://github.com/falcnor/PrintStack.git
```

2. Navigate to the project directory:
```bash
cd printstack
```

3. Open `index.html` in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

That's it! No build process or dependencies required.

## Usage

### Getting Started

1. **Add Filaments**: Navigate to the Filament Library and add your available filaments with their weights and colors.

2. **Add Models**: Go to the Models Library and add models you want to print, specifying which filaments each model requires.

3. **Record Prints**: Use the Print History page to log completed prints. This automatically updates your filament usage.

4. **View Statistics**: Check the Statistics page to see your printing patterns and identify printable models.

### File Structure

```
printstack/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── script.js           # Application logic
└── README.md          # This file
```

### Data Format

Data is stored locally in your browser's localStorage. You can export your data as JSON:

```json
{
  "filaments": [
    {
      "id": 1234567890,
      "material": "PLA",
      "color": "Red",
      "colorHex": "#ff0000",
      "weight": 1000,
      "inStock": true
    }
  ],
  "models": [
    {
      "id": 1234567891,
      "name": "Benchy",
      "requirements": [
        {
          "filamentId": 1234567890,
          "color": "Red",
          "material": "PLA"
        }
      ],
      "link": "https://example.com/benchy"
    }
  ],
  "prints": [
    {
      "id": 1234567892,
      "modelName": "Benchy",
      "color": "Red",
      "weight": 13.5,
      "date": "2024-01-15"
    }
  ],
  "exportDate": "2024-01-15T12:00:00.000Z"
}
```

## Browser Compatibility

PrintStack works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Dark mode support
- [ ] Multi-user support
- [ ] Cloud sync options
- [ ] Print time estimation
- [ ] Cost tracking per filament
- [ ] QR code generation for filament labels
- [ ] Mobile-responsive improvements
- [ ] CSV export option

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/falcnor/PrintStack/LICENSE) file for details.
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Acknowledgments

- Inspired by the 3D printing community's need for better inventory management
- Built with love for makers everywhere

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/falcnor/PrintStack/issues).

---

**Made with ❤️ for the 3D printing community**
