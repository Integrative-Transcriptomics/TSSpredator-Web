
package supergenome;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.LinkedList;
import java.util.List;


public class XmfaParser
{
	public static List<XmfaBlock> parseXmfa(String filename) throws IOException
	{
		List<XmfaBlock> blocks = new LinkedList<XmfaBlock>();
		BufferedReader br = new BufferedReader(new FileReader(filename));
		
		XmfaBlock tmpBlock = new XmfaBlock();
		String tmpSource=null;
		int tmpStart=0;
		int tmpEnd=0;
		char tmpStrand='.';
		
		StringBuffer sb=null;
		String[] headercells;
		
		for(String line = br.readLine(); line != null; line=br.readLine())
		{
			line = line.trim();
			if(line.length()==0)
				continue;
			
			//new Seq
			if(line.charAt(0)=='>')
			{
				//something in the buffer?
				if(sb!=null)
				{
					tmpBlock.addSeq(new XmfaSequence(tmpSource, tmpStart, tmpEnd, tmpStrand, sb.toString()));
				}
				
				sb = new StringBuffer();
				
				headercells = line.split("[:[\\s]]+");
				
				tmpSource = headercells[1];
				tmpStart = Integer.parseInt(headercells[2].split("-")[0]);
				tmpEnd = Integer.parseInt(headercells[2].split("-")[1]);
				tmpStrand = headercells[3].charAt(0);
			}
			else if(line.charAt(0)=='=')
			{
				tmpBlock.addSeq(new XmfaSequence(tmpSource, tmpStart, tmpEnd, tmpStrand, sb.toString()));
				blocks.add(tmpBlock);
				tmpBlock=new XmfaBlock();
				sb = null;
			}
			else if(sb != null)
			{
				sb.append(line);
			}
		}
		
		return blocks;
	}
}
