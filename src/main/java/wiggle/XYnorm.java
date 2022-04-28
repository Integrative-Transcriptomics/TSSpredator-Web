
package wiggle;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import main.Main;
import tss.TSS;
import tss.TSSpredictor;


public class XYnorm
{
	public static double minNormValue = Integer.MAX_VALUE;
	
	/*/
	public static void percentileNormalizeXY(double[] xy, double percentile)
	{
		//count non-zeros
		int count =0;
		for(int i=1; i<xy.length; i++)
			if(xy[i]>0)
				count++;
			
		
		double[] tmp = new double[count];
		for(int i=1, j=0; i<xy.length; i++)
			if(xy[i]>0)
			{
				tmp[j] = xy[i];
				j++;
			}
		
		Arrays.sort(tmp);
		
		double factor = tmp[(int)Math.floor(tmp.length*percentile)];
		minNormValue = Math.min(minNormValue, factor);
		
		System.out.println(factor);
		
		for(int i=1; i<xy.length; i++)
			xy[i] = xy[i]/factor;
	}//*/
	
	/*
	 * The factor is determined by using the 5' data only and also applied to the normal data
	 */
	/*/
	public static void percentileNormalize5primeAndNormalXY(double[] xy5prime, double[] xyNorm, double percentile)
	{
		//count non-zeros
		int count =0;
		for(int i=1; i<xy5prime.length; i++)
			if(xy5prime[i]>0)
				count++;
			
		
		double[] tmp = new double[count];
		for(int i=1, j=0; i<xy5prime.length; i++)
			if(xy5prime[i]>0)
			{
				tmp[j] = xy5prime[i];
				j++;
			}
		
		Arrays.sort(tmp);
		
		double factor = tmp[(int)Math.floor(tmp.length*percentile)];
		minNormValue = Math.min(minNormValue, factor);
		
		for(int i=1; i<xy5prime.length; i++)
			xy5prime[i] = xy5prime[i]/factor;
		
		for(int i=1; i<xyNorm.length; i++)
			xyNorm[i] = xyNorm[i]/factor;
	}//*/
	
	/*
	 * The factor is determined by using the 5' data only and also applied to the normal data
	 */
	public static void percentileNormalize5primeAndNormalXYplusAndMinus(double[] xy5primePlus, double[] xy5primeMinus, double[] xyNormPlus, double[] xyNormMinus, double percentile)
	{
		double[] joined = new double[xy5primePlus.length+xy5primeMinus.length-2];
		
		int j=0;
		for(int i=1; i<xy5primePlus.length; i++,j++)
			joined[j] = xy5primePlus[i];
		for(int i=1; i<xy5primeMinus.length; i++,j++)
			joined[j] = xy5primeMinus[i];
		
		//count non-zeros
		int count =0;
		for(int i=0; i<joined.length; i++)
			if(joined[i]>0)
				count++;
		
		//do not normalize empty data
		if(count==0)
			return;
			
		
		double[] tmp = new double[count];
		for(int i=0, t=0; i<joined.length; i++)
			if(joined[i]>0)
			{
				tmp[t] = joined[i];
				t++;
			}
		
		Arrays.sort(tmp);
		
		double factor = tmp[(int)Math.floor(tmp.length*percentile)];
		minNormValue = Math.min(minNormValue, factor);
		
		//Main.out.println("\tFactor "+ Math.round(factor*1000)/1000d );
		
		for(int i=1; i<xy5primePlus.length; i++)
			xy5primePlus[i] = xy5primePlus[i]/factor;
		
		for(int i=1; i<xy5primeMinus.length; i++)
			xy5primeMinus[i] = xy5primeMinus[i]/factor;
		
		for(int i=1; i<xyNormPlus.length; i++)
			xyNormPlus[i] = xyNormPlus[i]/factor;
		
		for(int i=1; i<xyNormMinus.length; i++)
			xyNormMinus[i] = xyNormMinus[i]/factor;
	}
	
	/*
	 * The factor is determined by using the 5' data only and also applied to the normal data
	 */
	/*/
	public static void percentileNormalizeXYplusAndMinus(double[] xyPlus, double[] xyMinus, double percentile)
	{
		double[] joined = new double[xyPlus.length+xyMinus.length-2];
		
		int j=0;
		for(int i=1; i<xyPlus.length; i++,j++)
			joined[j] = xyPlus[i];
		for(int i=1; i<xyMinus.length; i++,j++)
			joined[j] = xyMinus[i];
		
		//count non-zeros
		int count =0;
		for(int i=0; i<joined.length; i++)
			if(joined[i]>0)
				count++;
			
		
		double[] tmp = new double[count];
		for(int i=0, t=0; i<joined.length; i++)
			if(joined[i]>0)
			{
				tmp[t] = joined[i];
				t++;
			}
		
		Arrays.sort(tmp);
		
		double factor = tmp[(int)Math.floor(tmp.length*percentile)];
		minNormValue = Math.min(minNormValue, factor);
		
		System.out.println("\t"+ Math.round(factor*1000)/1000d );
		
		for(int i=1; i<xyPlus.length; i++)
			xyPlus[i] = xyPlus[i]/factor;
		
		for(int i=1; i<xyMinus.length; i++)
			xyMinus[i] = xyMinus[i]/factor;
	}//*/
	
	public static double getEnrichmentFactorPercentile(double[] fivePrimePlus, double[] normalPlus, double[] fivePrimeMinus, double[] normalMinus, double percentile)
	{
		List<TSS> tsss = TSSpredictor.predictTSS(fivePrimePlus, normalPlus, true);
		tsss.addAll(TSSpredictor.predictTSS(fivePrimeMinus, normalMinus, true));
		
		//do not normalize empty data
		if(tsss.size()==0)
			return 1;

		/* For the normalization, we want to exclude
		 * Infinity values from the enrichment distribution
		 * as they will bias the percentile calculation */
		List<Double> factorList = new ArrayList<>();
		// Filter for finite values
		factorList.addAll(tsss.stream().filter(tss ->
				Double.isFinite(tss.getEnrichFactor())).map(tss ->
				tss.getEnrichFactor()).collect(Collectors.toList()));

		// Sort the enrichment ratio distribution
		Collections.sort(factorList);

		/*
		// TODO: can be removed
		try(BufferedWriter bw = Files.newBufferedWriter(Paths.get("/home/fillinger/tsss_efactors.tsv"))){
			for (Double eFactor : factorList)
				bw.write(eFactor + "\n");
		} catch (IOException e){
			System.err.println("Could not write in file.");
		}
		*/
		return factorList.get((int)Math.floor(factorList.size()*percentile));
	}
	
	//
	public static void factorNormalizeXY(double[] xy, double factor)
	{
		for(int i=1; i<xy.length; i++)
			xy[i] = xy[i]*factor;
	}//*/
}
