
package wiggle;

public class XYtools {
	
	public static double getRegionMean(int start, int end, double[] xyTrack)
	{
		double scale = 1;
		if(XYnorm.minNormValue != Integer.MAX_VALUE)
			scale = XYnorm.minNormValue;
		
		double res = 0;
		
		for(int i=start;i<=end;i++)
			res+=xyTrack[i];
		
		return res/(end-start+1);
	}

}
