package wiggle;
import java.util.List;
import wiggle.SimplifyArray.Range;

public class XYtools {

	public static double getRegionMean(int start, int end, double[] xyTrack) {
		double scale;
		if (XYnorm.minNormValue != Integer.MAX_VALUE)
			scale = XYnorm.minNormValue;
		else
			scale = 1;

		double res = 0;

		for (int i = start; i <= end; i++)
			res += xyTrack[i];

		return res / (end - start + 1);
	}

	public static double[] aggregateWiggles(double[][] wiggleFilesCollected) {
		// get number of rows
		int nRows = wiggleFilesCollected.length;
		// get number of columns
		int nCols = wiggleFilesCollected[0].length;
		// create a new array to store the aggregated values
		double[] aggregatedWiggles = new double[nCols];
		// iterate over the columns
		for (int i = 0; i < nCols; i++) {
			// iterate over the rows
			for (int j = 0; j < nRows; j++) {
				// add the value to the aggregated value
				aggregatedWiggles[i] += wiggleFilesCollected[j][i];
				// divide the aggregated value by the number of rows, if it is the last row
				if (j == nRows - 1) {
					aggregatedWiggles[i] /= nRows;
				}
			}
		}
		// return the aggregated values
		return aggregatedWiggles;
	}
	public static List<Range> simplifyArray(double[] array) {
		List<Range> result = SimplifyArray.simplifyArray(array);
		return result;
	}
}
