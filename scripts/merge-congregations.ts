import * as fs from 'fs';
import * as path from 'path';

interface InputCongregationMeeting {
  name: string;
  midweekMeetingDay: number;
  midweekMeetingTime: string;
  weekendMeetingDay: number;
  weekendMeetingTime: string;
  phoneNumber?: string;
}

interface InputMeetingItem {
  id: string;
  congregationMeetings: InputCongregationMeeting[];
}

interface InputMeetingResponse {
  items: InputMeetingItem[];
}

interface OutputCongregationMeeting {
  name: string;
  midweekMeetingDay: number;
  weekendMeetingDay: number;
  phoneNumber: string | null;
}

interface MergedData {
  congregationMeetings: OutputCongregationMeeting[];
}

const inputPath = path.join(__dirname, '../congdata.json');
const outputPath = path.join(__dirname, '../merged-congregations.json');

/**
 * Normalizes a raw phone number string:
 * - Splits on ; , / \ . (as separator) "and" or multiple spaces
 * - Converts +233 / 233 country prefix to leading 0
 * - Strips internal dashes and spaces from each number
 * - Joins results with " / "
 */
function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const parts = raw.split(/\s*[;,/\\]\s*|\s+and\s+|\s*\.\s+|\s{2,}/);

  const normalized = parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      const hasPlus = p.startsWith('+');
      // Strip all non-digit characters
      let digits = p.replace(/\D/g, '');
      // +233XXXXXXXXX → 0XXXXXXXXX
      if (hasPlus && digits.startsWith('233')) {
        const local = digits.slice(3);
        digits = local.startsWith('0') ? local : '0' + local;
      // 233XXXXXXXXX (without +, e.g. 2330203001859) → 0XXXXXXXXX
      } else if (!hasPlus && digits.startsWith('233') && digits.length > 10) {
        const local = digits.slice(3);
        digits = local.startsWith('0') ? local : '0' + local;
      }
      return digits;
    })
    .filter((p) => p.length > 0);

  return normalized.length > 0 ? normalized.join(' / ') : null;
}

function mergeCongregations(): void {
  try {
    // Read the input JSON file
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const data: InputMeetingResponse = JSON.parse(rawData);

    // Merge all congregationMeetings into one array
    const mergedMeetings: OutputCongregationMeeting[] = [];

    data.items.forEach((item: InputMeetingItem): void => {
      if (item.congregationMeetings && Array.isArray(item.congregationMeetings)) {
        item.congregationMeetings.forEach((meeting: InputCongregationMeeting): void => {
          mergedMeetings.push({
            name: meeting.name,
            midweekMeetingDay: meeting.midweekMeetingDay,
            weekendMeetingDay: meeting.weekendMeetingDay,
            phoneNumber: normalizePhoneNumber(meeting.phoneNumber),
          });
        });
      }
    });

    // Create the output structure
    const output: MergedData = {
      congregationMeetings: mergedMeetings,
    };

    // Write the output JSON file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✓ Successfully merged ${mergedMeetings.length} congregation meetings`);
    console.log(`✓ Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error merging congregations:', error);
    process.exit(1);
  }
}

mergeCongregations();

