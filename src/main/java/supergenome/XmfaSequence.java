
package supergenome;

import java.util.LinkedList;
import java.util.List;

import main.Config;

public class XmfaSequence 
{

	private String sourceId;
	private int start;
	private int end;
	private char strand;
	private String seq;
	
	public XmfaSequence(String sourceId, int start, int end, char strand,String seq) 
	{
		this.sourceId = sourceId;
		this.start = start;
		this.end = end;
		this.strand = strand;
		this.seq = seq;
	}
	
	public XmfaSequence(XmfaSequence xmfa1, XmfaSequence xmfa2)
	{
		if(!xmfa1.getSourceId().equals(xmfa2.getSourceId()))
			throw new IllegalArgumentException();
		
		if(xmfa1.getStrand()!=xmfa2.getStrand())
			throw new IllegalArgumentException();
		
		if( xmfa1.getStart()<xmfa2.getStart() && xmfa1.getEnd()>xmfa2.getStart() || xmfa2.getStart()<xmfa1.getStart() && xmfa2.getEnd()>xmfa1.getStart())
			throw new IllegalArgumentException();
		
		StringBuffer s = new StringBuffer();
		
		//todo continue
	}

	public String getSourceId() {
		return sourceId;
	}

	public int getStart() {
		return start;
	}

	public int getEnd() {
		return end;
	}

	public char getStrand() {
		return strand;
	}

	public String getSeq() {
		return seq;
	}

	public String markBigGaps(int minGapLength)
	{
		StringBuffer tmp = new StringBuffer(seq);
		
		int memIndex = 0;
		int tmpLength=0;
		
		boolean inGap=false;
		
		for(int i=0; i<tmp.length(); i++)
		{
			if(inGap)
			{
				//gap extension?
				if(tmp.charAt(i)=='-')
					tmpLength++;
				else
				{
					//long enough
					if(tmpLength>=minGapLength)
					{
						for(int j=memIndex; j<=memIndex+tmpLength-1; j++)
							tmp.setCharAt(j, '_');
					}
					memIndex=0;
					tmpLength=0;
					
					inGap=false;
				}
			}
			else
			{
				//start gap?
				if(tmp.charAt(i)=='-')
				{
					memIndex=i;
					tmpLength=1;
					inGap=true;
				}
			}
		}
		return tmp.toString();
	}
	
	public List<Integer> getBreakPoints(int minGapLength)
	{
		int tmpLength=0;
		
		List<Integer> breaks = new LinkedList<Integer>();
		
		if(!Config.getBoolean("createSubBlocks"))
		{
			breaks.add(seq.length()-1);
			return breaks;
		}
		
		boolean inGap=seq.charAt(0)=='-';
		
		for(int i=0; i<seq.length(); i++)
		{
			if(inGap)
			{
				//gap extension?
				if(seq.charAt(i)=='-')
					tmpLength++;
				else
				{
					//long enough
					if(tmpLength>=minGapLength)
					{
						breaks.add(-(i-1));
					}
					
					tmpLength=0;
					
					inGap=false;
				}
			}
			else
			{
				//start gap?
				if(seq.charAt(i)=='-')
				{
					breaks.add(i-1);
					tmpLength=1;
					inGap=true;
				}
			}
		}
		
		if(inGap)
			if(tmpLength>=minGapLength)
			{
				breaks.add(-(seq.length()-1));
			}
			else
				breaks.add(seq.length()-1);
		else
			breaks.add(seq.length()-1);
		
		return breaks;
	}
	
}
