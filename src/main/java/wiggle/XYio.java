
package wiggle;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;


public class XYio {

    public static double[] readXYfile(String filepath, int genomeLength, int strand) throws IOException {
        double[] res;
        int length = 0;

        // forward = 1; reverse = -1
        // unknown = 0: In this case the strand is encoded in the values:
        // negative = fow; positive = rev

        //int strand = 1;
		
		/*/determine length
		BufferedReader br = new BufferedReader(new FileReader(filepath));
		String lastline = null;
		for(String line = br.readLine();line!=null;line=br.readLine())
		{
			if(line.trim().length()!=0)
				lastline=line;
		}
		br.close();
		
		if(lastline==null)
			throw new Error(filepath+" is empty!");
		
		length = Integer.parseInt(lastline.trim().split("[\\s]+")[0]);
		
		//*/

        res = new double[genomeLength + 1];

        //do not parse non existing file
        if (filepath == null || filepath.trim().length() == 0) {
            res[0] = strand;
            return res;
        }

        //read
        BufferedReader br = new BufferedReader(new FileReader(filepath));
        int index;
        double value;

        for (String line = br.readLine(); line != null; line = br.readLine()) {
            line = line.trim();
            if (line.length() == 0)
                continue;

            try {
                index = Integer.parseInt(line.trim().split("[\\s]+")[0]);
                value = Double.parseDouble(line.trim().split("[\\s]+")[1]);
            } catch (NumberFormatException e) {
                continue;
            }

            //if(value<0)//set strand
            //strand = -1;

            value = Math.abs(value);

            res[index] = value;
        }
        br.close();

        res[0] = strand;

        return res;
    }

    public static void writeXYfile(double[] xyTrack, String filename, String chrom) throws IOException {
        double scale = 1;
        if (XYnorm.minNormValue != Integer.MAX_VALUE) {
            scale = XYnorm.minNormValue;
        }

        double strand = xyTrack[0];

        if (strand == 0) {
            strand = 1; // keep values as they are
        }

        BufferedWriter bw = new BufferedWriter(new FileWriter(filename));
        double value;

        bw.append("variableStep chrom=" + chrom + "\n");
        for (int i = 1; i < xyTrack.length; i++) {
            value = xyTrack[i] * scale;
            if (value == 0)
                continue;

            //value = Math.round(value*10000)/10000.;

            bw.append(i + "\t" + value * strand + "\n");
        }
        bw.close();
    }
}
