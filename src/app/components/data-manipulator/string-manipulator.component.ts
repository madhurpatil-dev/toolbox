import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-string-manipulator',
    templateUrl: './string-manipulator.component.html',
    styleUrls: ['./string-manipulator.component.css'],
    standalone: false
})
export class StringManipulatorComponent implements OnInit {
  inputString: string = '';
  resultString: string = '';
  replaceFrom: string = '';
  replaceTo: string = '';
  insertContent: string = '';
  insertPosition: number = 0;
  showReplaceInputs: boolean = false;
  showInsertInputs: boolean = false;
  voices: SpeechSynthesisVoice[] = [];
  selectedVoice: SpeechSynthesisVoice | null = null;
  isSpeaking: boolean = false;

  searchQuery: string = '';
  selectedTabIndex: number = 0;
  allButtons: { [key: string]: { label: string; action: () => void }[] } = {
    'Basic': [
      { label: 'To Upper Case', action: () => this.toUpperCase() },
      { label: 'To Lower Case', action: () => this.toLowerCase() },
      { label: 'Capitalize Words', action: () => this.capitalizeWords() },
      { label: 'To Title Case', action: () => this.toTitleCase() },
      { label: 'Toggle Case', action: () => this.toggleCase() },
      { label: 'To Camel Case', action: () => this.toCamelCase() },
      { label: 'To Kebab Case', action: () => this.toKebabCase() },
      { label: 'To Snake Case', action: () => this.toSnakeCase() },
      { label: 'To Pascal Case', action: () => this.toPascalCase() },
    ],
    'Modify': [
      { label: 'Reverse String', action: () => this.reverseString() },
      { label: 'Reverse Words', action: () => this.reverseWords() },
      { label: 'Reverse Each Word', action: () => this.reverseEachWord() },
      { label: 'Remove Spaces', action: () => this.removeSpaces() },
      { label: 'Remove Punctuation', action: () => this.removePunctuation() },
      { label: 'Remove Duplicates', action: () => this.removeDuplicates() },
      { label: 'Remove Non-Alphanumeric', action: () => this.removeNonAlphanumeric() },
      { label: 'Sort Characters', action: () => this.sortCharacters() },
      { label: 'Scramble String', action: () => this.scrambleString() },
      { label: 'Truncate String', action: () => this.truncateString(10) },
      { label: 'Replace Substring', action: () => (this.showReplaceInputs = true) },
      { label: 'Insert Substring', action: () => (this.showInsertInputs = true) },
    ],
    'Encode/Decode': [
      { label: 'Encode Base64', action: () => this.encodeBase64() },
      { label: 'Decode Base64', action: () => this.decodeBase64() },
      { label: 'To Hexadecimal', action: () => this.toHexadecimal() },
      { label: 'From Hexadecimal', action: () => this.fromHexadecimal() },
      { label: 'To Binary', action: () => this.toBinary() },
      { label: 'From Binary', action: () => this.fromBinary() },
      { label: 'To ASCII', action: () => this.toAscii() },
      { label: 'From ASCII', action: () => this.fromAscii() },
      { label: 'To Morse Code', action: () => this.toMorseCode() },
      { label: 'From Morse Code', action: () => this.fromMorseCode() },
      { label: 'URL Encode', action: () => this.urlEncode() },
      { label: 'URL Decode', action: () => this.urlDecode() },
      { label: 'HTML Encode', action: () => this.htmlEncode() },
      { label: 'HTML Decode', action: () => this.htmlDecode() },
      { label: 'ROT13 Encrypt', action: () => this.rot13Encrypt() },
      { label: 'ROT13 Decrypt', action: () => this.rot13Decrypt() },
      { label: 'To ROT47', action: () => this.toRot47() },
      { label: 'From ROT47', action: () => this.fromRot47() },
    ],
    'Analyze': [
      { label: 'Count Words', action: () => this.countWords() },
      { label: 'Count Characters (Excl. Spaces)', action: () => this.countCharactersExcludingSpaces() },
      { label: 'Count Digits', action: () => this.countDigits() },
      { label: 'Count Vowels', action: () => this.countVowels() },
      { label: 'Count Consonants', action: () => this.countConsonants() },
      { label: 'Count Uppercase', action: () => this.countUppercase() },
      { label: 'Count Lowercase', action: () => this.countLowercase() },
      { label: 'Count Unique Characters', action: () => this.countUniqueCharacters() },
      { label: 'Count Sentences', action: () => this.countSentences() },
      { label: 'Check Palindrome', action: () => this.checkPalindrome() },
      { label: 'Check Isogram', action: () => this.checkIsogram() },
      { label: 'Check Anagram', action: () => this.checkAnagram() },
      { label: 'Levenshtein Distance', action: () => this.levenshteinDistance() },
      { label: 'Jaro-Winkler Similarity', action: () => this.jaroWinklerSimilarity() },
      { label: 'Sum of Digits', action: () => this.sumOfDigits() },
      { label: 'Find Longest Word', action: () => this.findLongestWord() },
      { label: 'Find Shortest Word', action: () => this.findShortestWord() },
      { label: 'Most Frequent Word', action: () => this.findMostFrequentWord() },
      { label: 'First Non-Repeated Char', action: () => this.findFirstNonRepeatedChar() },
      { label: 'Longest Palindrome', action: () => this.findLongestPalindromeSubstring() },
      { label: 'Count Specific Character', action: () => this.countSpecificCharacter('a') },
      { label: 'Count Specific Word', action: () => this.countSpecificWord('the') },
    ],
    'Misc': [
      { label: 'Generate Acronym', action: () => this.generateAcronym() },
      { label: 'To Pig Latin', action: () => this.toPigLatin() },
      { label: 'Shuffle Words', action: () => this.shuffleWords() },
      { label: 'Extract Unique Words', action: () => this.extractUniqueWords() },
      { label: 'Remove HTML Tags', action: () => this.removeHtmlTags() },
      { label: 'Newlines to <br>', action: () => this.convertNewlinesToBr() },
      { label: 'Generate Random String', action: () => this.generateRandomString(10) },
      { label: 'Find All Substrings', action: () => this.findAllSubstrings(3) },
    ],
  };
  filteredButtons: { label: string; action: () => void }[] = [];

  ngOnInit() {
    this.populateVoiceList();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.populateVoiceList.bind(this);
    }
    this.filterButtonsGlobally();
    this.setupSpeechEventListeners();
  }

  populateVoiceList() {
    if (typeof speechSynthesis === 'undefined') {
      return;
    }
    this.voices = speechSynthesis.getVoices();
    this.selectedVoice = this.voices.find(v => v.default) || this.voices[0] || null;
  }

  readTextAloud() {
    if (!this.inputString || this.isSpeaking) return;
    this.isSpeaking = true;
    const msg = new SpeechSynthesisUtterance(this.inputString);
    if (this.selectedVoice) {
      msg.voice = this.selectedVoice;
    }
    msg.onend = () => (this.isSpeaking = false);
    window.speechSynthesis.speak(msg);
  }

  stopTextAloud() {
    this.isSpeaking = false;
    window.speechSynthesis.cancel();
  }

  setupSpeechEventListeners() {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.addEventListener('start', () => (this.isSpeaking = true));
      speechSynthesis.addEventListener('end', () => (this.isSpeaking = false));
      speechSynthesis.addEventListener('error', () => (this.isSpeaking = false));
    }
  }

  clear() {
    this.inputString = '';
    this.resultString = '';
    this.filterButtonsGlobally();
  }

  clearAll() {
    this.inputString = '';
    this.resultString = '';
    this.replaceFrom = '';
    this.replaceTo = '';
    this.insertContent = '';
    this.insertPosition = 0;
    this.showReplaceInputs = false;
    this.showInsertInputs = false;
    this.filterButtonsGlobally();
  }

  resetInputs() {
    this.showReplaceInputs = false;
    this.showInsertInputs = false;
    this.replaceFrom = '';
    this.replaceTo = '';
    this.insertContent = '';
    this.insertPosition = 0;
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.resultString).then(
      () => alert('Result copied to clipboard!'),
      () => alert('Failed to copy result.')
    );
  }

  saveAsFile() {
    const blob = new Blob([this.resultString], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportResult() {
    const blob = new Blob([this.resultString], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  clearSearch() {
    this.searchQuery = '';
    this.filterButtonsGlobally();
  }

  filterButtonsGlobally() {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredButtons = [];
    for (const tab in this.allButtons) {
      this.filteredButtons = this.filteredButtons.concat(
        this.allButtons[tab].filter(btn => btn.label.toLowerCase().includes(query))
      );
    }
  }

  removeSpaces() {
    this.resultString = this.inputString.replace(/\s/g, '');
  }

  toUpperCase() {
    this.resultString = this.inputString.toUpperCase();
  }

  toLowerCase() {
    this.resultString = this.inputString.toLowerCase();
  }

  reverseString() {
    this.resultString = this.inputString.split('').reverse().join('');
  }

  reverseWords() {
    this.resultString = this.inputString.split(' ').reverse().join(' ');
  }

  countWords() {
    const words = this.inputString.match(/\b\w+\b/g);
    this.resultString = words ? words.length.toString() : '0';
  }

  capitalizeWords() {
    this.resultString = this.inputString.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  toggleCase() {
    this.resultString = this.inputString.replace(/./g, (char) =>
      char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
    );
  }

  removeDuplicates() {
    this.resultString = Array.from(new Set(this.inputString.split(''))).join('');
  }

  sortCharacters() {
    this.resultString = this.inputString.split('').sort().join('');
  }

  encodeBase64() {
    this.resultString = btoa(this.inputString);
  }

  decodeBase64() {
    this.resultString = atob(this.inputString);
  }

  toCamelCase() {
    this.resultString = this.inputString.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
  }

  truncateString(length: number) {
    this.resultString =
      this.inputString.length > length ? this.inputString.substring(0, length) + '...' : this.inputString;
  }

  toTitleCase() {
    this.resultString = this.inputString
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  checkPalindrome() {
    if (this.inputString) {
      const original = this.inputString.toLowerCase().replace(/[\W_]/g, '');
      const reversed = original.split('').reverse().join('');
      this.resultString = original === reversed ? 'Palindrome' : 'Not a Palindrome';
    }
  }

  replaceSubstring() {
    this.resultString = this.inputString.replace(new RegExp(this.replaceFrom, 'g'), this.replaceTo);
    this.resetInputs();
  }

  toKebabCase() {
    this.resultString = this.inputString.replace(/\W+/g, '-').toLowerCase();
  }

  toSnakeCase() {
    this.resultString = this.inputString.replace(/\W+/g, '_').toLowerCase();
  }

  toPascalCase() {
    this.resultString = this.inputString
      .replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .replace(/\W/g, '');
  }

  countCharactersExcludingSpaces() {
    this.resultString = this.inputString.replace(/\s/g, '').length.toString();
  }

  countVowels() {
    const match = this.inputString.match(/[aeiou]/gi);
    this.resultString = match ? match.length.toString() : '0';
  }

  countConsonants() {
    const match = this.inputString.match(/[^aeiou\s\d]/gi);
    this.resultString = match ? match.length.toString() : '0';
  }

  removePunctuation() {
    this.resultString = this.inputString.replace(/[^\w\s]|_/g, '');
  }

  toHexadecimal() {
    this.resultString = this.inputString
      .split('')
      .map((c) => c.charCodeAt(0).toString(16))
      .join(' ');
  }

  fromHexadecimal() {
    this.resultString = this.inputString
      .split(' ')
      .map((h) => String.fromCharCode(parseInt(h, 16)))
      .join('');
  }

  scrambleString() {
    this.resultString = this.inputString
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  generateAcronym() {
    this.resultString = this.inputString
      .split(' ')
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  levenshteinDistance() {
    const a = this.inputString;
    const b = this.replaceFrom;
    const matrix = Array.from(Array(a.length + 1), () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
          );
        }
      }
    }

    this.resultString = matrix[a.length][b.length].toString();
  }

  jaroWinklerSimilarity() {
    const s1 = this.inputString;
    const s2 = this.replaceFrom;

    if (!s1.length || !s2.length) {
      this.resultString = '0';
      return;
    }

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;

    const s1Matches = Array(s1.length).fill(false);
    const s2Matches = Array(s2.length).fill(false);

    let matches = 0;
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] === s2[j]) {
          s1Matches[i] = true;
          s2Matches[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) {
      this.resultString = '0';
      return;
    }

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (s1Matches[i]) {
        for (let j = k; j < s2.length; j++) {
          if (s2Matches[j]) {
            k = j + 1;
            break;
          }
        }
        if (s1[i] !== s2[k - 1]) transpositions++;
      }
    }

    const mPrime = matches / s1.length;
    const nPrime = matches / s2.length;
    const tPrime = (matches - transpositions / 2) / matches;

    const jaroSimilarity = (mPrime + nPrime + tPrime) / 3;
    const prefix = s1.substring(0, 4) === s2.substring(0, 4) ? 4 : 0;

    this.resultString = (jaroSimilarity + prefix * 0.1 * (1 - jaroSimilarity)).toFixed(2).toString();
  }

  rot13Encrypt() {
    this.resultString = this.inputString.replace(/[a-zA-Z]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))
    );
  }

  rot13Decrypt() {
    this.resultString = this.inputString.replace(/[a-zA-Z]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))
    );
  }

  urlEncode() {
    this.resultString = encodeURIComponent(this.inputString);
  }

  urlDecode() {
    this.resultString = decodeURIComponent(this.inputString);
  }

  htmlEncode() {
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    this.resultString = this.inputString.replace(/[&<>"']/g, (c) => htmlEntities[c] as string);
  }

  htmlDecode() {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<!doctype html><body>' + this.inputString, 'text/html');
    this.resultString = doc.body.textContent || '';
  }

  countSentences() {
    const match = this.inputString.match(/[^.!?]+[.!?]+/g);
    this.resultString = match ? match.length.toString() : '0';
  }

  removeHtmlTags() {
    const doc = new DOMParser().parseFromString(this.inputString, 'text/html');
    this.resultString = doc.body.textContent || '';
  }

  insertSubString() {
    if (this.insertPosition >= 0 && this.insertPosition <= this.inputString.length) {
      this.resultString =
        this.inputString.slice(0, this.insertPosition) +
        this.insertContent +
        this.inputString.slice(this.insertPosition);
    } else {
      this.resultString = this.inputString;
    }
    this.resetInputs();
  }

  countDigits() {
    const match = this.inputString.match(/\d/g);
    this.resultString = match ? match.length.toString() : '0';
  }

  shuffleWords() {
    this.resultString = this.inputString
      .split(' ')
      .sort(() => 0.5 - Math.random())
      .join(' ');
  }

  toRot47() {
    this.resultString = this.inputString.replace(/[!-~]/g, (c) =>
      String.fromCharCode(33 + ((c.charCodeAt(0) + 14) % 94))
    );
  }

  fromRot47() {
    this.resultString = this.inputString.replace(/[!-~]/g, (c) =>
      String.fromCharCode(33 + ((c.charCodeAt(0) + 47) % 94))
    );
  }

  countUppercase() {
    const match = this.inputString.match(/[A-Z]/g);
    this.resultString = match ? match.length.toString() : '0';
  }

  countLowercase() {
    const match = this.inputString.match(/[a-z]/g);
    this.resultString = match ? match.length.toString() : '0';
  }

  toMorseCode() {
    const morseCode: { [key: string]: string } = {
      a: '.-',
      b: '-...',
      c: '-.-.',
      d: '-..',
      e: '.',
      f: '..-.',
      g: '--.',
      h: '....',
      i: '..',
      j: '.---',
      k: '-.-',
      l: '.-..',
      m: '--',
      n: '-.',
      o: '---',
      p: '.--.',
      q: '--.-',
      r: '.-.',
      s: '...',
      t: '-',
      u: '..-',
      v: '...-',
      w: '.--',
      x: '-..-',
      y: '-.--',
      z: '--..',
      '1': '.----',
      '2': '..---',
      '3': '...--',
      '4': '....-',
      '5': '.....',
      '6': '-....',
      '7': '--...',
      '8': '---..',
      '9': '----.',
      '0': '-----',
    };
    this.resultString = this.inputString
      .toLowerCase()
      .split('')
      .map((char) => morseCode[char] || char)
      .join(' ');
  }

  fromMorseCode() {
    const morseCode: { [key: string]: string } = {
      '.-': 'a',
      '-...': 'b',
      '-.-.': 'c',
      '-..': 'd',
      '.': 'e',
      '..-.': 'f',
      '--.': 'g',
      '....': 'h',
      '..': 'i',
      '.---': 'j',
      '-.-': 'k',
      '.-..': 'l',
      '--': 'm',
      '-.': 'n',
      '---': 'o',
      '.--.': 'p',
      '--.-': 'q',
      '.-.': 'r',
      '...': 's',
      '-': 't',
      '..-': 'u',
      '...-': 'v',
      '.--': 'w',
      '-..-': 'x',
      '-.--': 'y',
      '--..': 'z',
      '-----': '0',
      '.----': '1',
      '..---': '2',
      '...--': '3',
      '....-': '4',
      '.....': '5',
      '-....': '6',
      '--...': '7',
      '---..': '8',
      '----.': '9',
    };
    this.resultString = this.inputString
      .split(' ')
      .map((code) => morseCode[code] || code)
      .join('');
  }

  countUniqueCharacters() {
    this.resultString = new Set(this.inputString).size.toString();
  }

  countSpecificCharacter(char: string) {
    const regex = new RegExp(char, 'g');
    const match = this.inputString.match(regex);
    this.resultString = match ? match.length.toString() : '0';
  }

  checkIsogram() {
    const str = this.inputString.toLowerCase().replace(/[\W_]/g, '');
    this.resultString = str
      .split('')
      .every((char, index, arr) => arr.indexOf(char) === index)
      ? 'Isogram'
      : 'Not an Isogram';
  }

  checkAnagram() {
    const str1 = this.inputString
      .toLowerCase()
      .replace(/[\W_]/g, '')
      .split('')
      .sort()
      .join('');
    const str2 = this.replaceFrom
      .toLowerCase()
      .replace(/[\W_]/g, '')
      .split('')
      .sort()
      .join('');
    this.resultString = str1 === str2 ? 'Anagram' : 'Not an Anagram';
  }

  toAscii() {
    this.resultString = this.inputString
      .split('')
      .map((char) => char.charCodeAt(0))
      .join(' ');
  }

  fromAscii() {
    this.resultString = this.inputString
      .split(' ')
      .map((code) => String.fromCharCode(Number(code)))
      .join('');
  }

  reverseEachWord() {
    this.resultString = this.inputString
      .split(' ')
      .map((word) => word.split('').reverse().join(''))
      .join(' ');
  }

  removeNonAlphanumeric() {
    this.resultString = this.inputString.replace(/[^a-z0-9]/gi, '');
  }

  findLongestWord() {
    const words = this.inputString.match(/\b\w+\b/g);
    this.resultString = words
      ? words.reduce((longest, current) => (current.length > longest.length ? current : longest), '')
      : '';
  }

  findShortestWord() {
    const words = this.inputString.match(/\b\w+\b/g);
    this.resultString = words
      ? words.reduce((shortest, current) => (current.length < shortest.length ? current : shortest), '')
      : '';
  }

  sumOfDigits() {
    const match = this.inputString.match(/\d/g);
    this.resultString = match
      ? match.reduce((sum, digit) => sum + Number(digit), 0).toString()
      : '0';
  }

  convertNewlinesToBr() {
    this.resultString = this.inputString.replace(/\n/g, '<br>');
  }

  extractUniqueWords() {
    const words = this.inputString.match(/\b\w+\b/g);
    this.resultString = words ? Array.from(new Set(words)).join(', ') : '';
  }

  findMostFrequentWord() {
    const words = this.inputString.match(/\b\w+\b/g);
    if (words) {
      const frequencyMap = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      const mostFrequentWord = Object.keys(frequencyMap).reduce((a, b) =>
        frequencyMap[a] > frequencyMap[b] ? a : b
      );
      this.resultString = mostFrequentWord;
    } else {
      this.resultString = '';
    }
  }

  toPigLatin() {
    this.resultString = this.inputString
      .split(' ')
      .map((word) => (word.length > 1 ? word.slice(1) + word[0] + 'ay' : word + 'ay'))
      .join(' ');
  }

  findFirstNonRepeatedChar() {
    const frequencyMap = this.inputString.split('').reduce((acc, char) => {
      acc[char] = (acc[char] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    this.resultString =
      this.inputString.split('').find((char) => frequencyMap[char] === 1) || '';
  }

  generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    this.resultString = Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  }

  toBinary() {
    this.resultString = this.inputString
      .split('')
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  }

  fromBinary() {
    this.resultString = this.inputString
      .split(' ')
      .map((bin) => String.fromCharCode(parseInt(bin, 2)))
      .join('');
  }

  findLongestPalindromeSubstring() {
    const isPalindrome = (s: string) => s === s.split('').reverse().join('');
    let longestPalindrome = '';
    for (let i = 0; i < this.inputString.length; i++) {
      for (let j = i + 1; j <= this.inputString.length; j++) {
        const substring = this.inputString.slice(i, j);
        if (isPalindrome(substring) && substring.length > longestPalindrome.length) {
          longestPalindrome = substring;
        }
      }
    }
    this.resultString = longestPalindrome;
  }

  findAllSubstrings(length: number) {
    const substrings = [];
    for (let i = 0; i <= this.inputString.length - length; i++) {
      substrings.push(this.inputString.slice(i, i + length));
    }
    this.resultString = substrings.join(', ');
  }

  countSpecificWord(word: string) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const match = this.inputString.match(regex);
    this.resultString = match ? match.length.toString() : '0';
  }
}
