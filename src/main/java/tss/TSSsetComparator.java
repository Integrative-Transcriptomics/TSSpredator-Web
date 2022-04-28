
package tss;
import java.util.*;

import main.Parameters;
import supergenome.SuperGenome;



public class TSSsetComparator 
{
	//private static double minHeightForDoubleCount = Parameters.minHeightFactorForDoubleCount * Parameters.minCliffHeight;
	
	
	@SuppressWarnings("unchecked")
	public static List<TSS> compareReplicates(List<TSS>[] dataSets)
	{
		List<TSS> res = new LinkedList<TSS>();
		
		Set<String>[] checkedTSS = new Set[dataSets.length];
		
		//if(dataSets.length==1)
			//return dataSets[0];
		
		//create Map
		Map<String,TSS>[] tssMaps = new HashMap[dataSets.length];
		for(int k=0; k<dataSets.length; k++)
		{
			tssMaps[k] = new HashMap<String, TSS>();
			for(TSS tss : dataSets[k])
				tssMaps[k].put(tss.getPosHashString(), tss);
		}
		
		int tmpCount;
		List<TSS> candList = new LinkedList<TSS>();
		
		for(int i=0; i<checkedTSS.length; i++)
			checkedTSS[i] = new HashSet<String>();
			
		TSS nearestTSS;
		
		for(int k=0; k<dataSets.length; k++)
		{			
			for(TSS tss : dataSets[k])
			{
				if(checkedTSS[k].contains(tss.getPosHashString()))
					continue;
				
				checkedTSS[k].add(tss.getPosHashString());
				
				tmpCount = 1;
				
				// replicate specific statistics
				tss.repHeights[k] = tss.height;
				tss.repStepFactors[k] = tss.cliffFactor;
				tss.repEnrich[k] = tss.enrichFactor;
						
				
//				if(tss.getHeight() >= minHeightForDoubleCount)
//					tmpCount++;
				
				
				for(int i=0; i<dataSets.length; i++)
				{
					if(i==k)
						continue;
					
					nearestTSS = null;
					
					//get candidate set from Map
					candList.clear();
					for(int j=tss.getPos()-Parameters.allowedRepShift; j<=tss.getPos()+Parameters.allowedRepShift; j++)
						if(tssMaps[i].get(Integer.toString(j)+tss.getStrand()) != null)
							candList.add(tssMaps[i].get(Integer.toString(j)+tss.getStrand()));
					
					//find matching TSS
					for(TSS otherTSS : candList)
					{
						
						checkedTSS[i].add(otherTSS.getPosHashString());
						
						//set first nearestTSS
						if(nearestTSS==null)
							nearestTSS=otherTSS;
						
						//otherTSS nearer?
						if(Math.abs(tss.compareTo(otherTSS)) < Math.abs(tss.compareTo(nearestTSS)))
							nearestTSS=otherTSS;
						
//							if(otherTSS.getHeight() >= minHeightForDoubleCount)
//								tmpCount++;
						
						//exact match -> don't look any further
						if(Math.abs(tss.compareTo(nearestTSS))==0)
							break;
						
					}
					
					//matching TSS found?
					if(nearestTSS!=null)
					{
						tmpCount++;
						
						//decide on new pos
						if(nearestTSS.getHeight()>tss.getHeight())
							tss.setPos(nearestTSS.getPos());
							
						tss.setMaxScores(nearestTSS.getHeight(), nearestTSS.getStrictHeight(), nearestTSS.getEnrichFactor(), nearestTSS.getCliffFactor());
						
						// replicate specific statistics
						tss.repHeights[i] = nearestTSS.height;
						tss.repStepFactors[i] = nearestTSS.cliffFactor;
						tss.repEnrich[i] = nearestTSS.enrichFactor;
					}
				}
				if(tmpCount>=Parameters.minNumRepMatches)
				{
					res.add(tss);
				}
			}
		}
		
		//cluster again
		res = TSSpredictor.solveClusters(res);
		
		return res;
	}
	
	
	
	
	public static List<TSS> compareDataSets(Map<String,List<TSS>> tssMap, SuperGenome superG)
	{
		List<TSS> res = new LinkedList<TSS>();

		Map<String,Set<String>> checkedTSS = new HashMap<String, Set<String>>();
		for(String s:tssMap.keySet())
			checkedTSS.put(s, new HashSet<String>());
		
		int tmpCount;
		
		TSS superTSS;
		TSS superOtherTSS;
		
		//create MapMap (maps SuperG coordinates to genomic TSS)
		Map<String,Map<String,TSS>> tssMapMap = new HashMap<String, Map<String,TSS>>();
		for(String s: tssMap.keySet())
		{
			tssMapMap.put(s, new HashMap<String, TSS>());
			for(TSS tss : tssMap.get(s))
				tssMapMap.get(s).put(superG.superGenomifyTSS(s, tss).getPosHashString(), tss);
		}
		
		
		
		for(String s: new TreeSet<String>(tssMap.keySet()))
		{			
			for(TSS tss : tssMap.get(s))
			{
				if(checkedTSS.get(s).contains(tss.getPosHashString()))
					continue;
				
				checkedTSS.get(s).add(tss.getPosHashString());
				
				superTSS = superG.superGenomifyTSS(s, tss);
				
				if(superTSS==null)
					continue;
				
				superTSS.addDetection(s);
				superTSS.addGenomicTSS(s, tss);
				if(superTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
					superTSS.addEnrichment(s);
				
				//tmpCount = 1;
				
				List<TSS> candList = new LinkedList<TSS>();
				
//				if(tss.getHeight() >= minHeightForDoubleCount)
//					tmpCount++;
				
				for(String t: tssMap.keySet())
				{
					if(s==t)
						continue;
					
					if(superG.genomifySuperTSS(t, superTSS)!=null)
						superTSS.addMapping(t);
					
					//get candidate set from Map
					candList.clear();
					for(int j=superTSS.getPos()-Parameters.allowedShift; j<=superTSS.getPos()+Parameters.allowedShift; j++)
						if(tssMapMap.get(t).get(Integer.toString(j)+superTSS.getStrand()) != null)
							candList.add(tssMapMap.get(t).get(Integer.toString(j)+superTSS.getStrand()));
					
					for(TSS otherTSS : candList)
					{
						superOtherTSS =	superG.superGenomifyTSS(t, otherTSS);
						if(superOtherTSS==null)
						{
							continue;
						}

						if(superTSS.getStrand()==superOtherTSS.getStrand() && Math.abs(superTSS.compareTo(superOtherTSS)) <= Parameters.allowedShift)
						{
							superTSS.addDetection(t);
							superTSS.addGenomicTSS(t, otherTSS);
							
							if(superOtherTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
								superTSS.addEnrichment(t);
							
							checkedTSS.get(t).add(otherTSS.getPosHashString());
							
							superTSS.setMaxScores(otherTSS.getHeight(), otherTSS.getStrictHeight(), otherTSS.getEnrichFactor(), otherTSS.getCliffFactor());


//							tmpCount++;
//							
//							if(otherTSS.getHeight() >= minHeightForDoubleCount)
//								tmpCount++;
							
							break;
						}
					}
				}
				
				if(superTSS.getHeight() >= Parameters.minCliffHeight  &&  superTSS.getCliffFactor() >= Parameters.minCliffFactor   &&  superTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
					res.add(superTSS);		
			}
		}
		
		//cluster again
		//res = TSSpredictor.solveClusters(res);
		Collections.sort(res);
		res = uniquifyTSS(res);
		
		return res;
	}
	
	private static List<TSS> uniquifyTSS(List<TSS> tsss)
	{
		if(tsss.size()==0)
			return tsss;
		
		List<TSS> res = new LinkedList<TSS>();
		
		TSS lastTSS = null;
		
		for(TSS tss : tsss)
		{
			if(lastTSS == null)
			{
				res.add(tss);
				lastTSS=tss;
			}
			
			if(tss.getPos()==lastTSS.getPos() && tss.getStrand()==lastTSS.getStrand())
				continue;
			else
			{
				res.add(tss);
				lastTSS=tss;
			}
		}
		
		return res;	
	}
	
	/*
	//Old TSS set comparison without SuperGenome
	@SuppressWarnings("unchecked")
	public static List<TSS> compareDataSets(List<TSS>[] dataSets)
	{
		List<TSS> res = new LinkedList<TSS>();
		
		Set<String>[] checkedTSS = new Set[dataSets.length];
		
		if(dataSets.length==1)
			return dataSets[0];
		
		int tmpCount;
		
		for(int i=0; i<checkedTSS.length; i++)
			checkedTSS[i] = new HashSet<String>();
			
		
		for(int k=0; k<dataSets.length; k++)
		{			
			for(TSS tss : dataSets[k])
			{
				if(checkedTSS[k].contains(tss.getPosHashString()))
					continue;
				
				checkedTSS[k].add(tss.getPosHashString());
				
				tmpCount = 1;
				
				if(tss.getHeight() >= minHeightForDoubleCount)
					tmpCount++;
				
				for(int i=0; i<dataSets.length; i++)
				{
					if(i==k)
						continue;
					
					for(TSS otherTSS : dataSets[i])
					{
						if( Math.abs(tss.compareTo(otherTSS)) <= Parameters.allowedShift)
						{
							checkedTSS[i].add(otherTSS.getPosHashString());
							
							tmpCount++;
							
							if(otherTSS.getHeight() >= minHeightForDoubleCount)
								tmpCount++;
							
							break;
						}
					}
				}
				if(tmpCount>=Parameters.minNumMatches)
				{
					res.add(tss);
				}
			}
		}
		
		//cluster again
		res = TSSpredictor.solveClusters(res);
		
		return res;
	}//*/
	
	/*
	//Old TSS set comparison without positional hash maps (much slower)
	@SuppressWarnings("unchecked")
	public static List<TSS> compareReplicatesOld(List<TSS>[] dataSets)
	{
		List<TSS> res = new LinkedList<TSS>();
		
		Set<String>[] checkedTSS = new Set[dataSets.length];
		
		//if(dataSets.length==1)
			//return dataSets[0];
		
		int tmpCount;
		
		for(int i=0; i<checkedTSS.length; i++)
			checkedTSS[i] = new HashSet<String>();
			
		TSS nearestTSS;
		
		for(int k=0; k<dataSets.length; k++)
		{			
			for(TSS tss : dataSets[k])
			{
				if(checkedTSS[k].contains(tss.getPosHashString()))
					continue;
				
				checkedTSS[k].add(tss.getPosHashString());
				
				tmpCount = 1;
				
//				if(tss.getHeight() >= minHeightForDoubleCount)
//					tmpCount++;
				
				for(int i=0; i<dataSets.length; i++)
				{
					if(i==k)
						continue;
					
					nearestTSS = null;
					
					//find matching TSS
					for(TSS otherTSS : dataSets[i])
					{
						if(tss.getStrand()==otherTSS.getStrand() && (Math.abs(tss.compareTo(otherTSS)) <= Parameters.allowedRepShift))
						{
							checkedTSS[i].add(otherTSS.getPosHashString());
							
							//set first nearestTSS
							if(nearestTSS==null)
								nearestTSS=otherTSS;
							
							//otherTSS nearer?
							if(Math.abs(tss.compareTo(otherTSS)) < Math.abs(tss.compareTo(nearestTSS)))
								nearestTSS=otherTSS;
							
//							if(otherTSS.getHeight() >= minHeightForDoubleCount)
//								tmpCount++;
							
							//exact match -> don't look any further
							if(Math.abs(tss.compareTo(nearestTSS))==0)
								break;
						}
					}
					
					//matching TSS found?
					if(nearestTSS!=null)
					{
						tmpCount++;
						
						//decide on new pos
						if(nearestTSS.getHeight()>tss.getHeight())
							tss.setPos(nearestTSS.getPos());
							
						tss.setMaxScores(nearestTSS.getHeight(), nearestTSS.getStrictHeight(), nearestTSS.getEnrichFactor(), nearestTSS.getCliffFactor());
					}
				}
				if(tmpCount>=Parameters.minNumRepMatches)
				{
					res.add(tss);
				}
			}
		}
		
		//cluster again
		res = TSSpredictor.solveClusters(res);
		
		return res;
	}//*/
	
	/*
	//Old TSS set comparison without positional hash maps (much slower)
	public static List<TSS> compareDataSetsOld(Map<String,List<TSS>> tssMap, SuperGenome superG)
	{
		List<TSS> res = new LinkedList<TSS>();
		
		Map<String,Set<String>> checkedTSS = new HashMap<String, Set<String>>();
		for(String s:tssMap.keySet())
			checkedTSS.put(s, new HashSet<String>());
		
		int tmpCount;
		
		TSS superTSS;
		TSS superOtherTSS;
		
		for(String s: tssMap.keySet())
		{			
			for(TSS tss : tssMap.get(s))
			{
				if(checkedTSS.get(s).contains(tss.getPosHashString()))
					continue;
				
				checkedTSS.get(s).add(tss.getPosHashString());
				
				superTSS = 	superG.superGenomifyTSS(s, tss);
				
				if(superTSS==null)
					continue;
				
				superTSS.addDetection(s);
				superTSS.addGenomicTSS(s, tss);
				if(superTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
					superTSS.addEnrichment(s);
				
				tmpCount = 1;
				
				if(tss.getHeight() >= minHeightForDoubleCount)
					tmpCount++;
				
				for(String t: tssMap.keySet())
				{
					if(s==t)
						continue;
					
					if(superG.genomifySuperTSS(t, superTSS)!=null)
						superTSS.addMapping(t);
					
					for(TSS otherTSS : tssMap.get(t))
					{
						superOtherTSS =	superG.superGenomifyTSS(t, otherTSS);
						if(superOtherTSS==null)
						{
							continue;
						}
						
						if(superTSS.getStrand()==superOtherTSS.getStrand() && Math.abs(superTSS.compareTo(superOtherTSS)) <= Parameters.allowedShift)
						{
							superTSS.addDetection(t);
							superTSS.addGenomicTSS(t, otherTSS);
							
							if(superOtherTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
								superTSS.addEnrichment(t);
							
							checkedTSS.get(t).add(otherTSS.getPosHashString());
							
							superTSS.setMaxScores(otherTSS.getHeight(), otherTSS.getStrictHeight(), otherTSS.getEnrichFactor(), otherTSS.getCliffFactor());
							
							tmpCount++;
							
							if(otherTSS.getHeight() >= minHeightForDoubleCount)
								tmpCount++;
							
							break;
						}
					}
				}
				
				if(superTSS.getHeight() >= Parameters.minCliffHeight  &&  superTSS.getCliffFactor() >= Parameters.minCliffFactor   &&  superTSS.getEnrichFactor() >= Parameters.min5primeToNormalFactor)
					res.add(superTSS);		
			}
		}
		
		//cluster again
		//res = TSSpredictor.solveClusters(res);
		Collections.sort(res);
		res = uniquifyTSS(res);
		
		return res;
	}//*/
}
