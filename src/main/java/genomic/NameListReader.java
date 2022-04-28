
package genomic;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class NameListReader {

    public static Set<String> readNameList(String filename) throws IOException {
        Set<String> res = new HashSet<String>();

        BufferedReader br = new BufferedReader(new FileReader(filename));

        for (String line = br.readLine(); line != null; line = br.readLine()) {
            line = line.trim();
            if (line.length() == 0)
                continue;

            res.add(line);
        }

        return res;
    }

    public static Map<String, String[]> readKonradsCorrectedAnnotations(String filename) throws IOException {
        Map<String, String[]> res = new HashMap<String, String[]>();

        BufferedReader br = new BufferedReader(new FileReader(filename));

        String[] cells;
        String[] iCells;

        for (String line = br.readLine(); line != null; line = br.readLine()) {
            line = line.trim();
            if (line.length() == 0)
                continue;

            if (line.charAt(0) == '#')
                continue;

            cells = line.split("\\t");

            if (cells.length != 9) {
                System.err.println("The following line in the annotation correction file does not have the required number of entries:\n" + line);
                continue;
            }

            iCells = new String[3];

            // #Locus_tag	Strand	Original_start_position	Original_end_position	Corrected_start_position	Corrected_end_position	Description	Typeofcorrection	Orthologs
            iCells[0] = cells[4];//start
            iCells[1] = cells[5];//end
            iCells[2] = cells[7];//correction type

            res.put(cells[0], iCells);
        }

        return res;
    }

}
