
package tss;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;

import main.Config;
import main.Parameters;


public class TSSpredictor 
{
	public static String getParameterString()
	{
		//return(Parameters.minCliffHeight+" "+Parameters.minCliffFactor+" "+Parameters.minPlateauLength+" "+Parameters.minNormalHeight+" "+Parameters.min5primeToNormalFactor+" "+Parameters.normPercentile+" "+Parameters.maxTSSinClusterDistance+" "+Parameters.TSSinClusterSelectionMethod+" "+Parameters.allowedShift+" "+TSSbenchmark.allowedShift);
		return("minCliffHeight:"+ Parameters.minCliffHeight+" minCliffFactor:"+ Parameters.minCliffFactor+" minPlateauLength:"+ Parameters.minPlateauLength+" minNormalHeight:"+Parameters.minNormalHeight+" min5primeToNormalFactor:"+Parameters.min5primeToNormalFactor+" normPercentile:"+Parameters.normPercentile+" maxTSSinClusterDistance:"+Parameters.maxTSSinClusterDistance+" TSSinClusterSelectionMethod:"+Parameters.TSSinClusterSelectionMethod+" allowedShift:"+Parameters.allowedShift+" TSSbenchmarkAllowedShift:"+TSSbenchmark.allowedShift);
	}
	

	public static List<TSS> predictTSS(double[] fivePrime, double[] normal, boolean runForEnrichmentFactorNorm)
	{
		List<TSS> res = new LinkedList<TSS>();
		int count=0;
		
		if(fivePrime[0]!=normal[0])//equal strand
			throw new Error("Input files do not correspond to the same strand!");
		
		//correct length
		if(normal.length<fivePrime.length)
		{
			double[] tmp = new double[fivePrime.length];
			for(int i=0; i<normal.length-1;i++)
				tmp[i]=normal[i];
			
			normal = tmp;
		}
		
		
		
		//strand specific parameters
		
		int stepPrecision = Math.max(1, Parameters.minPlateauLength);
		int start;
		int stop;
		int next;
		
		char strand = '+';
		if(normal[0]<0)//reverse
			strand='-';
		
		if(strand=='+')//forward
		{
			start= stepPrecision+1;
			stop=fivePrime.length;
			next=1;
		}
		else //reverse
		{
			start=fivePrime.length-(stepPrecision+1);
			stop=0;
			next=-1;
		}
		
		/*/normalize
		if(normPercentile>0)
		{
			XYnorm.percentileNormalizeXY(fivePrime, normPercentile);
			XYnorm.percentileNormalizeXY(normal, normPercentile);
			//XYnorm.percentileNormalize5primeAndNormalXY(fivePrime, normal, normPercentile);
		}//*/
		
		//find
		double height;
		double strictHeight;
		double plateauEndHeight;
		double cliffFactor;
		double enrichFactor;
		
		for(int i=start; i!=stop; i+=next)
		{
			height = 0; //fivePrime[i]-fivePrime[i-(next*stepPrecision)];
			cliffFactor = 0; //fivePrime[i]/fivePrime[i-(next*stepPrecision)];
			strictHeight = fivePrime[i]-fivePrime[i-next];
			
			//determin best step length and set height accordingly
			for(int j=i-(next*stepPrecision); j!=i; j+=next)
			{
				height = Math.max(height, fivePrime[i]-fivePrime[j]);
				cliffFactor = Math.max(cliffFactor, fivePrime[i]/fivePrime[j]);
			}
			
			/*
			// Old plateau length code
			// To use also uncomment code in if(height...
			
			plateauEndHeight = fivePrime[i]-fivePrime[i-(next*stepPrecision)];
			int plateauEnd;
			for(plateauEnd = i+next; plateauEnd != i+(Parameters.minPlateauLength+1)*next; plateauEnd+=next)
			{
				if(!(plateauEnd >= fivePrime.length || plateauEnd <= 0))
					plateauEndHeight = Math.min(plateauEndHeight, fivePrime[plateauEnd]-fivePrime[i-(next*stepPrecision)]);
				else
					plateauEndHeight = 0;
			}//*/
			
			enrichFactor = fivePrime[i]/normal[i];
			
			//if the TSS prediction is run in order to determine normalization factors for enrichment normalization
			//fixed parameters are used to guarantee reproducible normalization results
			if(runForEnrichmentFactorNorm)
			{
				if(height >= 0.1  &&  cliffFactor>= 1.5)
				{
					res.add(new TSS(i,strand,height,strictHeight,enrichFactor,cliffFactor));
				}
			}
			//normal mode:
			else
			{
				if(height >= Parameters.minCliffHeight-Parameters.minCliffHeightDiscount  &&  /*plateauEndHeight >= Parameters.minCliffHeight-Parameters.minCliffHeightDiscount  &&*/  cliffFactor>=Parameters.minCliffFactor-Parameters.minCliffFactorDiscount  &&  normal[i] >= Parameters.minNormalHeight)
				{
					res.add(new TSS(i,strand,height,strictHeight,enrichFactor,cliffFactor));
				}
			}
		}


		//res = solveClusters(res);
		
		return res;
	}



	public static List<TSS> solveClusters(List<TSS> tsss)
	{
		if(tsss.size()==0)
			return tsss;
		
		Collections.sort(tsss);
		
		List<TSS> res = new LinkedList<TSS>();
		
		List<TSS> cluster = new LinkedList<TSS>();
		
		ListIterator<TSS> it;
		TSS currTSS=null;
		TSS lastTSS=null;
		
		//forward strand
			it = tsss.listIterator();
			
			while(it.hasNext())
			{
				currTSS = it.next();
				
				if(currTSS.getStrand()!='+')
					continue;
				
				if(cluster.size()==0)
				{
					cluster.add(currTSS);
					lastTSS = currTSS;
					continue;
				}
				
				if(Math.abs(currTSS.getPos()-lastTSS.getPos())<=Parameters.maxTSSinClusterDistance)
				{
					//extend cluster
					cluster.add(currTSS);
					lastTSS=currTSS;
				}
				else
				{
					//finalize cluster and start new
					res.add(selectTSSfromCluster(cluster));
					cluster.clear();
					cluster.add(currTSS);
					lastTSS=currTSS;
				}
			}
			if(cluster.size()>0)
			{
				res.add(selectTSSfromCluster(cluster));
				cluster.clear();
			}		
		
		//reverse strand
			it = tsss.listIterator(tsss.size());
			
			while(it.hasPrevious())
			{
				currTSS = it.previous();
				
				if(currTSS.getStrand()!='-')
					continue;
				
				if(cluster.size()==0)
				{
					cluster.add(currTSS);
					lastTSS = currTSS;
					continue;
				}
				
				if(Math.abs(currTSS.getPos()-lastTSS.getPos())<=Parameters.maxTSSinClusterDistance)
				{
					//extend cluster
					cluster.add(currTSS);
					lastTSS=currTSS;
				}
				else
				{
					//finalize cluster and start new
					res.add(selectTSSfromCluster(cluster));
					cluster.clear();
					cluster.add(currTSS);
					lastTSS=currTSS;
				}
			}
			if(cluster.size()>0)
			{
				res.add(selectTSSfromCluster(cluster));
			}		
		
		Collections.sort(res);
		return res;
	}
	
	private static TSS selectTSSfromCluster(List<TSS> cluster)
	{
		if(cluster.size()==0)
			throw new Error("Empty cluster to process!");
		if(cluster.size()==1)
			return cluster.get(0);

		TSS res;
		
		if(Parameters.TSSinClusterSelectionMethod.equalsIgnoreCase("HIGHEST"))
		{
			res = cluster.get(0);
			for(TSS tss : cluster)
			{
				if(tss.getStrictHeight()>res.getStrictHeight())
					res=tss;
			}
		}
		else if(Parameters.TSSinClusterSelectionMethod.equalsIgnoreCase("FIRST"))
		{
			return cluster.get(0);
		}
		else
			throw new Error(Parameters.TSSinClusterSelectionMethod+" is an unknown TSS selection method!");
		
		return res;
	}
	
}
