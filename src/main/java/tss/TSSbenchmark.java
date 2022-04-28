
package tss;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;


public class TSSbenchmark {
    public static int allowedShift = 1;

    public static List<TSS> readTSS(File file) throws IOException {
        BufferedReader br = new BufferedReader(new FileReader(file));

        List<TSS> res = new LinkedList<TSS>();

        for (String line = br.readLine(); line != null; line = br.readLine()) {
            line = line.trim();
            if (line.length() == 0)
                continue;

            String[] cells;

            cells = line.split("[\\s]+");

            if (cells.length != 2) {
                System.err.println("Error while parsing line '" + line + "' from " + file.getAbsolutePath());
                continue;
            }

            res.add(new TSS(Integer.parseInt(cells[0]), cells[1].charAt(0), 0, 0, 0, 0));
        }

        return res;
    }

    public static void benchmark(List<TSS> tsss, File file) throws IOException {
        List<TSS> benchmark = readTSS(file);

        Set<TSS> predMatch = new HashSet<TSS>();
        Set<TSS> benchMatch = new HashSet<TSS>();

        for (TSS tss : tsss) {
            for (TSS benchTSS : benchmark) {
                if (Math.abs(tss.compareTo(benchTSS)) <= allowedShift) {
                    predMatch.add(tss);
                    benchMatch.add(benchTSS);
                }
            }
        }

        int TP = predMatch.size();
        int FP = tsss.size() - TP;

        int FN = benchmark.size() - benchMatch.size();

        double sens = (double) TP / (TP + FN);
        double ppv = (double) TP / tsss.size();

        System.out.println("Benchmark:");
        System.out.println("");
        System.out.println("Number of Predictions:    " + tsss.size());
        System.out.println("Number of known elements: " + benchmark.size());
        System.out.println("");
        System.out.println("True positives:  " + TP);
        System.out.println("False positives: " + FP);
        System.out.println("False negatives: " + FN);
        System.out.println("");
        System.out.println("Sensitivity: " + sens);
        System.out.println("Precision:   " + ppv);
        System.out.println("");
        System.out.println("Parameters: " + TSSpredictor.getParameterString());

    }
}
