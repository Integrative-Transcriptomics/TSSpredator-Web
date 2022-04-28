
package supergenome;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import main.Config;

public class GenomeRingBlocker 
{

	private Map<XmfaBlock,Integer> blockMap;
	private Map<String,List<Integer>> genomeBlockLists;
	public List<XmfaBlock> newBlockList;
	
	public GenomeRingBlocker(List<XmfaBlock> blocks, String[] ids)
	{
		blockMap = new HashMap<XmfaBlock, Integer>();
		newBlockList = new LinkedList<XmfaBlock>();
		genomeBlockLists = new HashMap<String, List<Integer>>();
		
		int index=1;
		for(XmfaBlock b:blocks)
		{
			b.createSubBlocks(Config.getInt("minGapBlockLength"));
			if(b.getSubBlockLengths().size()==0)
				continue;
			
			blockMap.put(b, index);
			newBlockList.add(b);
			index+=b.getSubBlockLengths().size();			
		}
		
		List<XmfaBlock> gBlockList;
		BlockComparator blockComp;
		List<Integer> iList;
		Integer ind;
		boolean reverse;
		for(String id:ids)
		{
			//System.out.print("\n"+id+":"); // Debug
			gBlockList = new LinkedList<XmfaBlock>();
			for(XmfaBlock b:blocks)
				if(b.getSeqs().containsKey(id))
					gBlockList.add(b);
			
			blockComp = new BlockComparator(id);
			Collections.sort(gBlockList, blockComp);
			
			iList = new LinkedList<Integer>();
			for(XmfaBlock b:gBlockList)
			{
				//System.out.print(b.getSeq(id).getStart()+"-"+b.getSeq(id).getEnd()+"; "); // Debug
				
				if(b.getSeq(id).getStrand()=='-')
					reverse = true;
				else
					reverse = false;
				
				ind = blockMap.get(b);
				
				if(ind==null)
					continue;
				
				if(reverse)
					ind = ind + b.getSubBlockLengths().size()-1;
				
				if(!reverse)
					for(Set<String> conts:b.getSubBlockContains())
					{
					
						if(conts.contains(id))
						{
							iList.add(ind);
						}
						
						ind++;
					}
				else
				{
					Set<String> conts;
					for(int i=b.getSubBlockContains().size()-1; i>=0; i--)
					{
						conts = b.getSubBlockContains().get(i);
						
						if(conts.contains(id))
						{
							iList.add(-ind);
						}
						
						ind--;
					}
				}
			}
			genomeBlockLists.put(id, iList);
		}
		
	}
	
	
	private class BlockComparator implements Comparator<XmfaBlock>
	{
		private String myRefGenome;
		
		public BlockComparator(String refGenome)
		{
			super();
			this.myRefGenome = refGenome;
		}

		@Override
		public int compare(XmfaBlock b1, XmfaBlock b2)
		{
			int b1Start = 0;
			int b2Start = 0;
			
			if(b1.getSeqs().containsKey(myRefGenome) && b2.getSeqs().containsKey(myRefGenome))
			{
				b1Start = b1.getSeqs().get(myRefGenome).getStart();
				b2Start = b2.getSeqs().get(myRefGenome).getStart();
			}
			
			return b1Start-b2Start;
		}
		
	}


	public Map<XmfaBlock, Integer> getBlockMap() {
		return blockMap;
	}


	public Map<String, List<Integer>> getGenomeBlockLists() {
		return genomeBlockLists;
	}
	
}
