
package supergenome;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;


public class XmfaBlock 
{
	private Map<String, XmfaSequence> seqs;
	private List<SubBlock> subBlocks;
	
	public XmfaBlock()
	{
		seqs = new HashMap<String, XmfaSequence>();
	}

	public Map<String, XmfaSequence> getSeqs() {
		return seqs;
	}
	
	public void addSeq(XmfaSequence seq)
	{
		if(!(seq.getStart()==0 && seq.getEnd()==0))
			seqs.put(seq.getSourceId(), seq);
	}
	
	public XmfaSequence getSeq(String sourceID)
	{
		return seqs.get(sourceID);
	}
	
	public int getNumSeqs()
	{
		return seqs.size();
	}
	
	public int getBlockLength()
	{
		if(seqs.size()==0)
			return 0;
		else
		{
			int res=0;
			for(XmfaSequence s : seqs.values())
				res = s.getSeq().length();
			return res;
		}
	}
	
	public void createSubBlocks(int minGapLength)
	{
		List<SubBlock> res = new LinkedList<SubBlock>();
		
		Map<String,List<Integer>> breaks = new HashMap<String, List<Integer>>();
		
		for(String id:seqs.keySet())
		{
			breaks.put(id, seqs.get(id).getBreakPoints(minGapLength));
		}
		
		int lastBreak = 0;
		int nextBeak = Integer.MAX_VALUE;
		Set<String> contSet;
				
		while(true)
		{
			contSet = new HashSet<String>();
			nextBeak = Integer.MAX_VALUE;
			
			for(String id:breaks.keySet())
				for(int b:breaks.get(id))
					if(Math.abs(b) > lastBreak)
					{
						if(b>0)
							contSet.add(id);
						
						if(Math.abs(b)-lastBreak < nextBeak-lastBreak)
							nextBeak=Math.abs(b);
						
						break;
					}
			
			if(nextBeak==Integer.MAX_VALUE)
				break;
			
			res.add(new SubBlock(lastBreak, nextBeak-1, contSet));
			lastBreak = nextBeak;
		}
		
		
		subBlocks = new LinkedList<SubBlock>();
		
		SubBlock currBlock = null;
		for(SubBlock b: res)
		{
			if(b.getlength() >= minGapLength && b.containSet.size()!=0)
			{
				if(currBlock==null)
					currBlock=b;
				else
					if(currBlock.containSet.equals(b.containSet))
					{
						currBlock.start=Math.min(currBlock.start, b.start);
						currBlock.end=Math.max(currBlock.end, b.end);
					}
					else
					{
						subBlocks.add(currBlock);
						currBlock=b;
					}
			}
		}
		
		if(currBlock!=null)
			subBlocks.add(currBlock);
				
	}
	
	public List<Integer> getSubBlockLengths()
	{
		List<Integer> res = new LinkedList<Integer>();
		
		for(SubBlock sb:subBlocks)
			res.add(sb.getlength());
		
		return res;
	}
	
	public List<int[]> getSubBlockPositions()
	{
		List<int[]> res = new LinkedList<int[]>();
		
		int[] tmp;
		
		for(SubBlock sb:subBlocks)
		{
			tmp = new int[2];
			tmp[0] = sb.start;
			tmp[1] = sb.end;
			res.add(tmp);
		}
		
		return res;
	}
	
	public List<Set<String>> getSubBlockContains()
	{
		List<Set<String>> res = new LinkedList<Set<String>>();
		
		for(SubBlock sb:subBlocks)
			res.add(sb.containSet);
		
		return res;
	}
	
	public class SubBlock
	{
		public int start;
		public int end;
		
		public Set<String> containSet;
		
		public SubBlock(int start, int end, Set<String> containSet)
		{
			this.start = start;
			this.end = end;
			this.containSet = containSet;
		}
		
		public int getlength()
		{
			return end-start+1;
		}
	}
}
