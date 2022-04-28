
package tss;

import genomic.Gene;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.print.attribute.HashAttributeSet;

import main.Parameters;


public class TSSclassifier 
{
	public static void classifyTSSOld(List<TSS> tsss, List<Gene> genes)
	{
		boolean tmp;
		
		Gene closest;
		
		for(TSS tss : tsss)
		{
			closest = null;
			
			for(Gene g : genes)
			{
				//UTR, internal
				if(tss.getStrand()==g.getStrand())
				{
					tmp=false;
					//forward
					if(tss.getStrand()=='+')
						if(tss.getPos()<=g.getStart())
							tmp=true;
					//reverse
					if(tss.getStrand()=='-')
						if(tss.getPos()>=g.getEnd())
							tmp=true;
					
					//UTR
					if(tmp && tss.utrDistanceTo(g)<=Parameters.maxUTRlength)
					{
						if(closest==null || tss.utrDistanceTo(g)<tss.utrDistanceTo(closest))
							closest=g;
					}
					
					//internal
					if(!tmp && tss.utrDistanceTo(g)==0)
					{
						tss.addInternalGene(g);
					}
				}
				
				//antisense
				if(tss.getStrand()!=g.getStrand())
				{
					if(tss.utrDistanceTo(g)<=Parameters.maxASutrLength)
					{
						tss.addAntisenseGene(g);
					}
				}
			}
			
			if(closest!=null)
			{
				//something on the other strand between TSS and gene?
				tmp=true;
				for(Gene g: genes)
				{
					if(tss.getStrand()=='+')
						if(g.getStrand()=='-' && g.getStart()>tss.getPos() && g.getStart()<closest.getStart() 	&& g.getEnd()>tss.getPos() && g.getEnd()<closest.getStart())
							tmp=false;
					
					if(tss.getStrand()=='-')
						if(g.getStrand()=='+' && g.getEnd()<tss.getPos() && g.getEnd()>closest.getEnd() 		&& g.getStart()<tss.getPos() && g.getStart()>closest.getEnd())
							tmp=false;
				}
				
				if(tmp)
				{
					tss.setSecondary(closest);
					closest.addUTRtss(tss);
				}
			}
		}
		
		//classify primary, secondary
		for(Gene g : genes)
			g.classifyUTRtsss();
	}
	
	public static void classifyTSS(List<TSS> tsss, List<Gene> genes)
	{
		boolean tmp;
		
		Gene closest;
		
		//create candidate sets for TSS
		Map<String,TSS> tssPosMap = new HashMap<String, TSS>();
		Map<TSS,List<Gene>> tssCandMap = new HashMap<TSS, List<Gene>>();
		for(TSS t : tsss)
		{
			tssPosMap.put(t.getPosHashString(), t);
			tssCandMap.put(t, new LinkedList<Gene>());
		}
		
		int maxUTR = Math.max(Parameters.maxUTRlength, Parameters.maxASutrLength);
		TSS tmptss;
		char[] plusminus = {'+','-'};
		for(Gene g : genes)
		{
			for(int i=g.getStart()-maxUTR;i<=g.getEnd()+maxUTR;i++)
			{
				for(char c : plusminus)
				{
					tmptss = tssPosMap.get(Integer.toString(i)+c);
					if(tmptss!=null)
					{						
						tssCandMap.get(tmptss).add(g);
					}
				}
			}
		}
		
		for(TSS tss : tsss)
		{
			closest = null;
			
			for(Gene g : tssCandMap.get(tss))
			{
				//UTR, internal
				if(tss.getStrand()==g.getStrand())
				{
					tmp=false;
					//forward
					if(tss.getStrand()=='+')
						if(tss.getPos()<=g.getStart())
							tmp=true;
					//reverse
					if(tss.getStrand()=='-')
						if(tss.getPos()>=g.getEnd())
							tmp=true;
					
					//UTR
					if(tmp && tss.utrDistanceTo(g)<=Parameters.maxUTRlength)
					{
						if(closest==null || tss.utrDistanceTo(g)<tss.utrDistanceTo(closest))
							closest=g;
					}
					
					//internal
					if(!tmp && tss.utrDistanceTo(g)==0)
					{
						tss.addInternalGene(g);
						//System.out.println(tss.getAntisenseOrientation());
					}
				}
				
				//antisense
				if(tss.getStrand()!=g.getStrand())
				{
					if(tss.utrDistanceTo(g)<=Parameters.maxASutrLength)
					{
						tss.addAntisenseGene(g);
						tss.setOrientation(g);
						//System.out.println(tss.getAntisenseOrientation());
					}
				}
			}
			
			if(closest!=null)
			{
				//something on the other strand between TSS and gene?
				tmp=true;
				for(Gene g: genes)
				{
					if(tss.getStrand()=='+')
						if(g.getStrand()=='-' && g.getStart()>tss.getPos() && g.getStart()<closest.getStart() 	&& g.getEnd()>tss.getPos() && g.getEnd()<closest.getStart())
							tmp=false;
					
					if(tss.getStrand()=='-')
						if(g.getStrand()=='+' && g.getEnd()<tss.getPos() && g.getEnd()>closest.getEnd() 		&& g.getStart()<tss.getPos() && g.getStart()>closest.getEnd())
							tmp=false;
				}
				
				if(tmp)
				{
					tss.setSecondary(closest);
					closest.addUTRtss(tss);
				}
			}
		}
		
		//classify primary, secondary
		for(Gene g : genes)
			g.classifyUTRtsss();
	}
	
	public static void classifyTSS(TSS tss, List<Gene> genes)
	{
		List<TSS> tsss = new LinkedList<TSS>();
		tsss.add(tss);
		classifyTSS(tsss, genes);
	}
}
